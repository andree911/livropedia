from flask import Blueprint, request, jsonify
from models import db, Usuario, Avaliacao, Lista, ListaItem, Livro
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
from itsdangerous import URLSafeTimedSerializer

users = Blueprint("users", __name__)

@users.route("/me", methods=["DELETE"])
@jwt_required()
def delete_account():
    dados = request.json

    senha = dados.get("senha")

    user_id = int(get_jwt_identity())

    usuario = Usuario.query.get(user_id)
    
    if not user_id:
        return jsonify({"erro": "Token inválido"}), 401

    if not usuario:
        return jsonify({"erro": "Usuário não encontrado"}), 404
    
    senha_valida = bcrypt.checkpw(
        senha.encode("utf-8"),
        usuario.senha.encode("utf-8")
    )

    if not senha_valida:
        return jsonify({"erro": "Senha incorreta"}), 401

    # Precisa limpar dependentes antes: Postgres bloqueia o delete se
    # ainda houver avaliacoes/listas/capas referenciando esse usuario.
    listas_ids = [l.id for l in Lista.query.filter_by(usuario_id=user_id).all()]
    if listas_ids:
        ListaItem.query.filter(ListaItem.lista_id.in_(listas_ids)).delete(synchronize_session=False)

    Lista.query.filter_by(usuario_id=user_id).delete(synchronize_session=False)
    Avaliacao.query.filter_by(usuario_id=user_id).delete(synchronize_session=False)
    Livro.query.filter_by(capa_usuario_id=user_id).update({"capa_usuario_id": None})

    db.session.delete(usuario)
    db.session.commit()

    return jsonify({"msg": "Conta apagada"})


@users.route("/me", methods=["PATCH"])
@jwt_required()
def add_name():
    user_id = get_jwt_identity()

    usuario = Usuario.query.get(user_id)

    if not usuario:
        return jsonify({"erro": "Usuário não encontrado"}), 404

    if usuario.nome:
        return jsonify({"erro": "Nome já definido"}), 400

    dados = request.get_json()

    if "nome" in dados:
        usuario.nome = dados["nome"]

    db.session.commit()

    return jsonify({
        "msg": "Dados atualizados com sucesso",
        "nome": usuario.nome
    }), 200

@users.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    usuario = Usuario.query.get(user_id)

    if not usuario:
        return jsonify({"erro": "Usuário não encontrado"}), 404

    return jsonify({
        "email": usuario.email,
        "nome": usuario.nome
    }), 200