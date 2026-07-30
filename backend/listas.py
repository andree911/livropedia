from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Livro, Lista, ListaItem

listas = Blueprint("listas", __name__)

NOMES_VALIDOS = ("Quero ler", "Lendo", "Lido")


@listas.route("/listas", methods=["GET"])
@jwt_required()
def listar_minhas_listas():
    usuario_id = int(get_jwt_identity())

    resultado = {nome: [] for nome in NOMES_VALIDOS}

    minhas_listas = Lista.query.filter_by(usuario_id=usuario_id).all()
    for lista in minhas_listas:
        if lista.nome not in resultado:
            continue
        livros = (
            Livro.query.join(ListaItem, ListaItem.livro_id == Livro.id)
            .filter(ListaItem.lista_id == lista.id)
            .all()
        )
        resultado[lista.nome] = [livro.to_dict() for livro in livros]

    return jsonify(resultado)


@listas.route("/livros/<int:livro_id>/minhas-listas", methods=["GET"])
@jwt_required()
def minhas_listas_do_livro(livro_id):
    usuario_id = int(get_jwt_identity())

    nomes = (
        db.session.query(Lista.nome)
        .join(ListaItem, ListaItem.lista_id == Lista.id)
        .filter(Lista.usuario_id == usuario_id, ListaItem.livro_id == livro_id)
        .all()
    )

    return jsonify({"listas": [nome for (nome,) in nomes]})


@listas.route("/livros/<int:livro_id>/listas", methods=["POST"])
@jwt_required()
def adicionar_a_lista(livro_id):
    if not Livro.query.get(livro_id):
        return jsonify({"erro": "Livro não encontrado"}), 404

    dados = request.get_json() or {}
    nome = dados.get("nome")

    if nome not in NOMES_VALIDOS:
        return jsonify({"erro": f"nome deve ser um de: {', '.join(NOMES_VALIDOS)}"}), 400

    usuario_id = int(get_jwt_identity())

    lista = Lista.query.filter_by(usuario_id=usuario_id, nome=nome).first()
    if not lista:
        lista = Lista(usuario_id=usuario_id, nome=nome)
        db.session.add(lista)
        db.session.commit()

    item = ListaItem.query.filter_by(lista_id=lista.id, livro_id=livro_id).first()
    if not item:
        item = ListaItem(lista_id=lista.id, livro_id=livro_id)
        db.session.add(item)
        db.session.commit()

    return jsonify({"mensagem": "Adicionado à lista", "nome": nome}), 201


@listas.route("/livros/<int:livro_id>/listas/<string:nome>", methods=["DELETE"])
@jwt_required()
def remover_da_lista(livro_id, nome):
    if nome not in NOMES_VALIDOS:
        return jsonify({"erro": f"nome deve ser um de: {', '.join(NOMES_VALIDOS)}"}), 400

    usuario_id = int(get_jwt_identity())

    lista = Lista.query.filter_by(usuario_id=usuario_id, nome=nome).first()
    if lista:
        ListaItem.query.filter_by(lista_id=lista.id, livro_id=livro_id).delete()
        db.session.commit()

    return jsonify({"mensagem": "Removido da lista", "nome": nome})
