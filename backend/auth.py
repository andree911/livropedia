from flask import Blueprint, request, jsonify, current_app
from models import db, Usuario
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
)
from itsdangerous import URLSafeTimedSerializer
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from email_utils import enviar_email
import bcrypt

auth = Blueprint("auth", __name__)

def get_serializer():
    return URLSafeTimedSerializer(
        current_app.config["SECRET_KEY"]
    )

def gerarToken(email):
    serializer = get_serializer()
    return serializer.dumps(email, salt="forgot-password")

def validarToken(token, expiracao=900):
    serializer = get_serializer()
    try:
        email = serializer.loads(
            token,
            salt="forgot-password",
            max_age=expiracao
        )
        return email
    except:
        return None

@auth.route("/register", methods=["POST"])
def register():
    try:
        dados = request.json
        email = dados.get("email")
        senha = dados.get("senha")

        if not email or not senha:
            return jsonify({"erro": "Preencha todos os campos"}), 400

        user_exists = Usuario.query.filter_by(email=email).first()
        if user_exists:
            return jsonify({"erro": "Email já cadastrado"}), 400

        senha_hash = bcrypt.hashpw(
            senha.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        novo_usuario = Usuario(email=email, senha=senha_hash)

        db.session.add(novo_usuario)
        db.session.commit()

        access_token = create_access_token(identity=str(novo_usuario.id))
        refresh_token = create_refresh_token(identity=str(novo_usuario.id))

        return jsonify({
            "msg": "Usuário criado",
            "access_token": access_token,
            "refresh_token": refresh_token
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"ERRO NO REGISTRO: {str(e)}")
        return jsonify({"erro": "Erro interno no servidor", "detalhe": str(e)}), 500

@auth.route("/login", methods=["POST"])
def login():

    dados = request.get_json()

    email = dados.get("email")
    senha = dados.get("senha")

    if not email or not senha:
        return jsonify({"erro": "Preencha todos os campos"}), 400
    
    usuario = Usuario.query.filter_by(email=email).first()

    if not usuario:
        return jsonify({"erro": "Usuário não encontrado"}), 404

    if not usuario.senha:
        return jsonify({"erro": "Esta conta usa login com Google"}), 400

    if not bcrypt.checkpw(senha.encode("utf-8"), usuario.senha.encode("utf-8")):
        return jsonify({"erro": "Senha incorreta"}), 401

    token = create_access_token(identity=str(usuario.id))
    refresh_token = create_refresh_token(identity=str(usuario.id))

    return jsonify({"token": token, "refresh_token": refresh_token})

@auth.route("/auth/google", methods=["POST"])
def login_google():
    dados = request.get_json() or {}
    credential = dados.get("credential")

    if not credential:
        return jsonify({"erro": "credential é obrigatório"}), 400

    try:
        payload = google_id_token.verify_oauth2_token(
            credential, google_requests.Request(), current_app.config["GOOGLE_CLIENT_ID"]
        )
    except ValueError:
        return jsonify({"erro": "Token do Google inválido"}), 401

    email = payload.get("email")

    if not email or not payload.get("email_verified"):
        return jsonify({"erro": "Email do Google não verificado"}), 401

    nome = payload.get("name")

    usuario = Usuario.query.filter_by(email=email).first()

    if not usuario:
        usuario = Usuario(email=email, senha=None, nome=nome)
        db.session.add(usuario)
        db.session.commit()
    elif not usuario.nome and nome:
        usuario.nome = nome
        db.session.commit()

    token = create_access_token(identity=str(usuario.id))
    refresh_token = create_refresh_token(identity=str(usuario.id))

    return jsonify({"token": token, "refresh_token": refresh_token})

@auth.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    novo_access_token = create_access_token(identity=get_jwt_identity())
    return jsonify({"access_token": novo_access_token})

@auth.route("/forgot-password", methods=["POST"])
def recuperar_senha():

    dados = request.get_json()
    email = dados.get("email")

    usuario = Usuario.query.filter_by(email=email).first()

    if not usuario:
        return{"mensagem": "Se o email existir, enviaremos instruções"}
    
    token = gerarToken(email)
    link = f"{current_app.config['FRONTEND_URL']}/redefinir-senha?token={token}"

    enviado = enviar_email(
        email,
        "Recuperação de senha — Livropédia",
        f"Recebemos um pedido pra redefinir sua senha.\n\n"
        f"Clique no link abaixo (válido por 15 minutos):\n{link}\n\n"
        f"Se não foi você, pode ignorar este email."
    )

    if not enviado:
        print(f"[dev] Link de recuperação: {link}")

    return{"mensagem": "Email enviado"}

@auth.route("/reset-password", methods=["POST"])
def resetar_senha():

    dados = request.get_json()

    token = dados.get("token")
    nova_senha = dados.get("senha")

    senha_hash = bcrypt.hashpw(
        nova_senha.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    email = validarToken(token)

    usuario = Usuario.query.filter_by(email=email).first()

    usuario.senha = senha_hash
    db.session.commit()
    db.session.expire_all()

    return {"mensagem": "Senha atualizada"}
