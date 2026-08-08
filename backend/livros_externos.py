from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Livro
import os
import re
import requests

livros_externos = Blueprint("livros_externos", __name__)

GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"

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

    resp = requests.get(
        GOOGLE_BOOKS_URL,
        params={"q": q, "maxResults": 10, "key": chave},
        timeout=10
    )

    if not resp.ok:
        return jsonify({"erro": "Falha ao consultar o Google Books"}), 502

    itens = resp.json().get("items", [])

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
