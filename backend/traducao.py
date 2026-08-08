from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from concurrent.futures import ThreadPoolExecutor
from models import db, Livro, LivroTraducao, Usuario
import re
import requests

traducao = Blueprint("traducao", __name__)

MYMEMORY_URL = "https://api.mymemory.translated.net/get"

# A maioria dos titulos/resumos importados (Google Books, ou Open Library
# nos livros mais antigos) esta em ingles.
# Livros adicionados/editados manualmente em outro idioma nao sao detectados
# aqui - a MyMemory nao oferece deteccao automatica gratuita, entao a
# traducao desses pode sair ruim (fica pra uma melhoria futura).
IDIOMA_ORIGEM = "en"

IDIOMAS_SUPORTADOS = {
    "pt": "Português",
    "en": "English",
    "es": "Español",
    "fr": "Français",
    "de": "Deutsch",
    "it": "Italiano",
    "ja": "日本語",
}

# A MyMemory limita o tamanho de cada requisicao; resumos maiores precisam
# ser quebrados em trechos menores e traduzidos separadamente.
TAMANHO_MAX_TRECHO = 450

# Limite de chamadas simultaneas pra MyMemory num lote (catalogo/busca), pra
# nao estourar o rate limit gratuito nem abrir conexoes demais de uma vez.
MAX_PARALELAS = 8

# A base de traducao comunitaria da MyMemory as vezes devolve entradas ruins
# mesmo tendo o maior "match" score: marcacao XLIFF vazada (<bpt>/<ept>), o
# texto original sem traduzir mesmo (alguem cadastrou errado no corpus
# deles), ou - pra textos sem sentido tipo dado de teste ("kkkkk") - uma
# entrada completamente aleatoria de baixissima confianca (ex: "kkkkk"
# virou "kkkkk dicas fostes xD" puxando um "match" de 0.56 de outro
# segmento qualquer do corpus). Filtra tudo isso e so aceita uma alternativa
# do array `matches` se o proprio "match" score dela for alto o suficiente
# pra confiar; senao mantem o texto original em vez de arriscar um chute.
_TAG_RE = re.compile(r"<[^>]+>")
CONFIANCA_MINIMA = 0.6


def _extrair_traducao(dados, texto_original):
    original_normalizado = texto_original.strip().casefold()

    def valido(candidato, confianca):
        return bool(
            candidato
            and not _TAG_RE.search(candidato)
            and candidato.strip().casefold() != original_normalizado
            and (confianca is None or confianca >= CONFIANCA_MINIMA)
        )

    resposta_principal = dados.get("responseData", {}) or {}
    principal = resposta_principal.get("translatedText") or ""
    if valido(principal, resposta_principal.get("match")):
        return principal

    for match in dados.get("matches", []):
        candidato = match.get("translation") or ""
        if valido(candidato, match.get("match")):
            return candidato

    # Nada com confianca suficiente: melhor devolver o texto original (sem
    # tag) do que uma traducao quebrada ou sem relacao nenhuma com o texto.
    return _TAG_RE.sub("", principal).strip() or texto_original


def _dividir_em_trechos(texto, tamanho_max=TAMANHO_MAX_TRECHO):
    palavras = texto.split()
    trechos = []
    atual = ""

    for palavra in palavras:
        candidato = f"{atual} {palavra}".strip()
        if len(candidato) > tamanho_max and atual:
            trechos.append(atual)
            atual = palavra
        else:
            atual = candidato

    if atual:
        trechos.append(atual)

    return trechos


def _chamar_mymemory(trecho, idioma_destino):
    resp = requests.get(
        MYMEMORY_URL,
        params={"q": trecho, "langpair": f"{IDIOMA_ORIGEM}|{idioma_destino}"},
        timeout=10,
    )
    resp.raise_for_status()
    return _extrair_traducao(resp.json(), trecho)


def _traduzir_texto(texto, idioma_destino):
    if not texto:
        return texto

    trechos = _dividir_em_trechos(texto)
    if len(trechos) == 1:
        return _chamar_mymemory(trechos[0], idioma_destino)

    # Trechos de um mesmo texto sao traduzidos em paralelo (sao independentes
    # entre si) e depois juntados na ordem original.
    with ThreadPoolExecutor(max_workers=len(trechos)) as executor:
        traduzidos = list(executor.map(lambda t: _chamar_mymemory(t, idioma_destino), trechos))

    return " ".join(traduzidos)


def _idioma_do_usuario_atual():
    usuario = Usuario.query.get(int(get_jwt_identity()))
    idioma = usuario.idioma if usuario else None
    return idioma if idioma in IDIOMAS_SUPORTADOS else None


def _preencher_traducao(registro, livro, idioma, campos):
    # Preenche so o que ainda falta no registro (cache parcial: um pedido so
    # de titulo, por exemplo, nao dispara traducao do resumo, e vice-versa).
    # Titulo e resumo tambem sao traduzidos em paralelo entre si.
    pendentes = {}
    if "titulo" in campos and not registro.titulo and livro.titulo:
        pendentes["titulo"] = livro.titulo
    if "resumo" in campos and not registro.resumo and livro.resumo:
        pendentes["resumo"] = livro.resumo

    if not pendentes:
        return False

    with ThreadPoolExecutor(max_workers=len(pendentes)) as executor:
        futuros = {
            campo: executor.submit(_traduzir_texto, texto, idioma)
            for campo, texto in pendentes.items()
        }

    if "titulo" in futuros:
        registro.titulo = futuros["titulo"].result()
    if "resumo" in futuros:
        registro.resumo = futuros["resumo"].result()

    return True


@traducao.route("/livros/<int:livro_id>/traducao", methods=["GET"])
@jwt_required()
def traduzir_livro(livro_id):
    livro = Livro.query.get(livro_id)
    if not livro:
        return jsonify({"erro": "Livro não encontrado"}), 404

    idioma = _idioma_do_usuario_atual()
    if not idioma:
        return jsonify({"traducao": None})

    registro = LivroTraducao.query.filter_by(livro_id=livro_id, idioma=idioma).first()
    if not registro:
        registro = LivroTraducao(livro_id=livro_id, idioma=idioma)
        db.session.add(registro)

    try:
        mudou = _preencher_traducao(registro, livro, idioma, {"titulo", "resumo"})
    except requests.RequestException:
        db.session.rollback()
        return jsonify({"erro": "Falha ao traduzir"}), 502

    if mudou:
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            registro = LivroTraducao.query.filter_by(livro_id=livro_id, idioma=idioma).first()
    else:
        db.session.rollback()

    return jsonify({"traducao": registro.to_dict()})


@traducao.route("/livros/traduzir-titulos", methods=["POST"])
@jwt_required()
def traduzir_titulos():
    idioma = _idioma_do_usuario_atual()
    if not idioma:
        return jsonify({"titulos": {}})

    livro_ids = (request.get_json() or {}).get("livro_ids") or []
    if not livro_ids:
        return jsonify({"titulos": {}})

    livros = {l.id: l for l in Livro.query.filter(Livro.id.in_(livro_ids)).all()}
    registros = {
        r.livro_id: r
        for r in LivroTraducao.query.filter(
            LivroTraducao.livro_id.in_(livro_ids), LivroTraducao.idioma == idioma
        ).all()
    }

    pendentes = [
        livro_id
        for livro_id in livro_ids
        if livros.get(livro_id)
        and livros[livro_id].titulo
        and not (registros.get(livro_id) and registros[livro_id].titulo)
    ]

    # As chamadas pra MyMemory rodam todas em paralelo (sao so rede, nao
    # tocam no banco); os writes ficam todos pra depois, na thread principal
    # - assim nao precisa de sessao SQLAlchemy compartilhada entre threads.
    traduzidos_novos = {}
    if pendentes:
        with ThreadPoolExecutor(max_workers=min(MAX_PARALELAS, len(pendentes))) as executor:
            futuros = {
                livro_id: executor.submit(_traduzir_texto, livros[livro_id].titulo, idioma)
                for livro_id in pendentes
            }
        for livro_id, futuro in futuros.items():
            try:
                traduzidos_novos[livro_id] = futuro.result()
            except requests.RequestException:
                pass

    resultado = {}
    for livro_id in livro_ids:
        livro = livros.get(livro_id)
        if not livro:
            continue

        registro = registros.get(livro_id)
        if livro_id in traduzidos_novos:
            if not registro:
                registro = LivroTraducao(livro_id=livro_id, idioma=idioma)
                db.session.add(registro)
                registros[livro_id] = registro
            registro.titulo = traduzidos_novos[livro_id]

        if registro and registro.titulo:
            resultado[livro_id] = registro.titulo

    if traduzidos_novos:
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()

    return jsonify({"titulos": {str(k): v for k, v in resultado.items()}})


@traducao.route("/livros/traduzir-textos", methods=["POST"])
@jwt_required()
def traduzir_textos():
    # Usado na busca externa (Google Books), antes do livro existir no
    # nosso banco — sem livro_id ainda, entao sem cache em LivroTraducao.
    textos = (request.get_json() or {}).get("textos") or []

    idioma = _idioma_do_usuario_atual()
    if not idioma or not textos:
        return jsonify({"textos": textos})

    resultado = list(textos)
    indices_com_texto = [i for i, texto in enumerate(textos) if texto]

    if indices_com_texto:
        with ThreadPoolExecutor(max_workers=min(MAX_PARALELAS, len(indices_com_texto))) as executor:
            futuros = {
                i: executor.submit(_traduzir_texto, textos[i], idioma) for i in indices_com_texto
            }
        for i, futuro in futuros.items():
            try:
                resultado[i] = futuro.result()
            except requests.RequestException:
                pass  # mantem o texto original nesse indice

    return jsonify({"textos": resultado})
