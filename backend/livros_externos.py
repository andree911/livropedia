from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from concurrent.futures import ThreadPoolExecutor
from models import db, Livro, LivroExternoCache
from busca_ia import normalizar_busca_com_ia
import os
import re
import requests

livros_externos = Blueprint("livros_externos", __name__)

GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"
OPEN_LIBRARY_COVERS_URL = "https://covers.openlibrary.org/b/isbn"
OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json"
OPEN_LIBRARY_WORKS_URL = "https://openlibrary.org"

_HTML_TAG_RE = re.compile(r"<[^>]+>")


def _limpar_resumo(texto):
    # A descricao do Google Books as vezes vem com tags HTML simples
    # (<p>, <b>...); tira isso antes de guardar/exibir como markdown.
    if not texto:
        return texto
    sem_tags = _HTML_TAG_RE.sub(" ", texto)
    return re.sub(r"\s+", " ", sem_tags).strip()


def _isbn_de(identificadores):
    if not identificadores:
        return None
    por_tipo = {i.get("type"): i.get("identifier") for i in identificadores}
    return por_tipo.get("ISBN_13") or por_tipo.get("ISBN_10")


def _ano_de(data_publicacao):
    if not data_publicacao:
        return None
    try:
        return int(data_publicacao[:4])
    except (ValueError, TypeError):
        return None


def _capa_url_de(image_links):
    if not image_links:
        return None
    url = image_links.get("thumbnail") or image_links.get("smallThumbnail")
    if not url:
        return None

    url = url.replace("http://", "https://").replace("&edge=curl", "")

    # O "thumbnail" da API vem pequeno (~128x205). O servidor de imagens do
    # Google Books aceita esse parametro de redimensionamento (mesma infra
    # do Google Fotos) e devolve a mesma imagem numa resolucao maior - sem
    # inventar detalhe, so serve o original ate o tamanho real disponivel.
    return f"{url}&fife=w400-h600"


def _capa_openlibrary(isbn):
    # A Open Library serve capas direto por ISBN. Com "default=false" ela
    # devolve 404 em vez da imagem generica de "sem capa" quando nao tem
    # nada cadastrado - assim da pra checar existencia sem baixar a imagem
    # inteira nem arriscar mostrar o placeholder deles como se fosse capa
    # real.
    try:
        url = f"{OPEN_LIBRARY_COVERS_URL}/{isbn}-L.jpg?default=false"
        resp = requests.head(url, timeout=5, allow_redirects=True)
        return url if resp.status_code == 200 else None
    except requests.RequestException:
        return None


def _resumo_openlibrary(isbn):
    # A Open Library nao devolve descricao na busca por ISBN direto -
    # precisa achar a "obra" (work) correspondente primeiro e so entao
    # buscar a descricao dela (2 chamadas).
    try:
        resp = requests.get(
            OPEN_LIBRARY_SEARCH_URL,
            params={"isbn": isbn, "fields": "key"},
            timeout=5,
        )
        docs = resp.json().get("docs", []) if resp.ok else []
        work_key = docs[0].get("key") if docs else None
        if not work_key:
            return None

        resp2 = requests.get(f"{OPEN_LIBRARY_WORKS_URL}{work_key}.json", timeout=5)
        if not resp2.ok:
            return None

        descricao = resp2.json().get("description")
        if isinstance(descricao, dict):
            descricao = descricao.get("value")
        return descricao if isinstance(descricao, str) else None
    except requests.RequestException:
        return None


def _buscar_fallback(resultado):
    # Roda em paralelo (thread pool) - so faz chamada de rede pro que
    # realmente falta preencher.
    isbn = resultado.get("isbn")
    if not isbn:
        return resultado["external_id"], None, None

    capa = None if resultado.get("capa_url") else _capa_openlibrary(isbn)
    resumo = None if resultado.get("resumo") else _resumo_openlibrary(isbn)
    return resultado["external_id"], capa, resumo


def _enriquecer_resultados(resultados):
    # Cache de livro no banco: se ja buscamos esse external_id antes (em
    # qualquer busca, de qualquer usuario), usa o que ja temos guardado em
    # vez de bater na Open Library nao vez nenhuma.
    cache_por_id = {
        c.external_id: c
        for c in LivroExternoCache.query.filter(
            LivroExternoCache.external_id.in_([r["external_id"] for r in resultados])
        ).all()
    }

    faltando_fallback = []
    for r in resultados:
        cache = cache_por_id.get(r["external_id"])
        if cache:
            r["capa_url"] = r.get("capa_url") or cache.capa_url
            r["resumo"] = r.get("resumo") or cache.resumo

        # So vale a pena bater na Open Library se ainda faltar algo e
        # tivermos ISBN pra buscar por ele.
        if r.get("isbn") and (not r.get("capa_url") or not r.get("resumo")):
            faltando_fallback.append(r)

    if faltando_fallback:
        with ThreadPoolExecutor(max_workers=min(8, len(faltando_fallback))) as executor:
            fallbacks = list(executor.map(_buscar_fallback, faltando_fallback))

        for external_id, capa, resumo in fallbacks:
            r = next(x for x in faltando_fallback if x["external_id"] == external_id)
            if capa:
                r["capa_url"] = capa
            if resumo:
                r["resumo"] = _limpar_resumo(resumo)

            if not capa and not resumo:
                continue

            cache = cache_por_id.get(external_id)
            if cache:
                cache.capa_url = r.get("capa_url")
                cache.resumo = r.get("resumo")
            else:
                cache = LivroExternoCache(
                    external_id=external_id,
                    titulo=r.get("titulo"),
                    autor=r.get("autor"),
                    capa_url=r.get("capa_url"),
                    resumo=r.get("resumo"),
                    isbn=r.get("isbn"),
                    ano_publicacao=r.get("ano_publicacao"),
                )
                db.session.add(cache)
                cache_por_id[external_id] = cache

        db.session.commit()

    return resultados


def _buscar_google_books(q, chave):
    resp = requests.get(
        GOOGLE_BOOKS_URL,
        params={"q": q, "maxResults": 10, "key": chave},
        timeout=10
    )
    if not resp.ok:
        return None
    return resp.json().get("items", [])


def _itens_para_resultados(itens):
    resultados = []
    for item in itens:
        info = item.get("volumeInfo", {})
        if not info.get("title"):
            continue

        resultados.append({
            "external_id": item["id"],
            "titulo": info.get("title"),
            "autor": ", ".join(info.get("authors", [])) or None,
            "capa_url": _capa_url_de(info.get("imageLinks")),
            "ano_publicacao": _ano_de(info.get("publishedDate")),
            "isbn": _isbn_de(info.get("industryIdentifiers")),
            "resumo": _limpar_resumo(info.get("description")),
        })
    return resultados


@livros_externos.route("/livros/buscar-externo", methods=["GET"])
def buscar_externo():
    q = request.args.get("q", "").strip()

    if not q:
        return jsonify({"erro": "Informe o parâmetro q"}), 400

    chave = os.getenv("GOOGLE_BOOKS_API_KEY")
    if not chave:
        return jsonify({
            "erro": "GOOGLE_BOOKS_API_KEY não configurada no backend"
        }), 500

    itens = _buscar_google_books(q, chave)
    if itens is None:
        return jsonify({"erro": "Falha ao consultar o Google Books"}), 502

    # IA so entra quando a busca "crua" nao deu em nada - normaliza o termo
    # (corrige grafia, traduz, completa) e tenta de novo. Fontes reais
    # (Google Books, e o fallback Open Library acima) continuam sendo a
    # unica origem dos dados do livro em si.
    if not itens:
        termo_normalizado = normalizar_busca_com_ia(q)
        if termo_normalizado and termo_normalizado.strip().lower() != q.lower():
            itens = _buscar_google_books(termo_normalizado, chave) or []

    resultados = _itens_para_resultados(itens)
    resultados = _enriquecer_resultados(resultados)

    # Marca quais resultados ja existem no nosso catalogo, pra o front
    # oferecer "ver no catalogo" em vez de "Importar" de novo.
    ja_importados = {
        l.external_id: l.id
        for l in Livro.query.filter(
            Livro.external_id.in_([r["external_id"] for r in resultados])
        ).all()
    }
    for r in resultados:
        r["livro_id"] = ja_importados.get(r["external_id"])

    return jsonify(resultados)


@livros_externos.route("/livros/importar", methods=["POST"])
@jwt_required()
def importar_livro():
    dados = request.get_json() or {}

    external_id = dados.get("external_id")
    titulo = dados.get("titulo")
    autor = dados.get("autor")

    if not external_id or not titulo or not autor:
        return jsonify({"erro": "external_id, titulo e autor são obrigatórios"}), 400

    existente = Livro.query.filter_by(external_id=external_id).first()
    if existente:
        return jsonify(existente.to_dict()), 200

    # O resumo ja vem na propria busca do Google Books - diferente da Open
    # Library, nao precisa de uma segunda chamada so pra buscar a descricao.
    novo = Livro(
        titulo=titulo,
        autor=autor,
        resumo=dados.get("resumo"),
        capa_url=dados.get("capa_url"),
        fonte_externa="googlebooks",
        external_id=external_id,
        isbn=dados.get("isbn"),
        ano_publicacao=dados.get("ano_publicacao")
    )

    db.session.add(novo)
    db.session.commit()

    return jsonify(novo.to_dict()), 201
