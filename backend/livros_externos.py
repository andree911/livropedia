from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Livro
import requests

livros_externos = Blueprint("livros_externos", __name__)

OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json"
OPEN_LIBRARY_WORKS_URL = "https://openlibrary.org/works/{work_id}.json"
OPEN_LIBRARY_COVER_URL = "https://covers.openlibrary.org/b/id/{cover_id}-L.jpg"


def _external_id_from_key(key):
    # key vem como "/works/OL45804W" -> guardamos só "OL45804W"
    return key.rsplit("/", 1)[-1]


def _capa_url_de(cover_id):
    if not cover_id:
        return None
    return OPEN_LIBRARY_COVER_URL.format(cover_id=cover_id)


@livros_externos.route("/livros/buscar-externo", methods=["GET"])
def buscar_externo():
    q = request.args.get("q", "").strip()

    if not q:
        return jsonify({"erro": "Informe o parâmetro q"}), 400

    resp = requests.get(
        OPEN_LIBRARY_SEARCH_URL,
        params={
            "q": q,
            "limit": 10,
            "fields": "key,title,author_name,cover_i,first_publish_year,isbn"
        },
        timeout=10
    )

    if not resp.ok:
        return jsonify({"erro": "Falha ao consultar a Open Library"}), 502

    docs = resp.json().get("docs", [])

    resultados = [
        {
            "external_id": _external_id_from_key(doc["key"]),
            "titulo": doc.get("title"),
            "autor": ", ".join(doc.get("author_name", [])) or None,
            "capa_url": _capa_url_de(doc.get("cover_i")),
            "ano_publicacao": doc.get("first_publish_year"),
            "isbn": (doc.get("isbn") or [None])[0]
        }
        for doc in docs
        if doc.get("key", "").startswith("/works/")
    ]

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

    resumo = None
    try:
        resp = requests.get(
            OPEN_LIBRARY_WORKS_URL.format(work_id=external_id),
            timeout=10
        )
        if resp.ok:
            work = resp.json()
            descricao = work.get("description")
            if isinstance(descricao, dict):
                resumo = descricao.get("value")
            elif isinstance(descricao, str):
                resumo = descricao
    except requests.RequestException:
        pass

    novo = Livro(
        titulo=titulo,
        autor=autor,
        resumo=resumo,
        capa_url=dados.get("capa_url"),
        fonte_externa="openlibrary",
        external_id=external_id,
        isbn=dados.get("isbn"),
        ano_publicacao=dados.get("ano_publicacao")
    )

    db.session.add(novo)
    db.session.commit()

    return jsonify(novo.to_dict()), 201
