from flask import Blueprint, request, jsonify, current_app
from models import db, Usuario
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from itsdangerous import URLSafeTimedSerializer
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

        return jsonify({
            "msg": "Usuário criado",
            "access_token": access_token
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

    if not bcrypt.checkpw(senha.encode("utf-8"), usuario.senha.encode("utf-8")):
        return jsonify({"erro": "Senha incorreta"}), 401
    
    token = create_access_token(identity=str(usuario.id))

    return jsonify({"token": token})

@auth.route("/forgot-password", methods=["POST"])
def recuperar_senha():

    dados = request.get_json()
    email = dados.get("email")

    usuario = Usuario.query.filter_by(email=email).first()

    if not usuario:
        return{"mensagem": "Se o email existir, enviaremos instruções"}
    
    token = gerarToken(email)

    print(f"Link de recuperação:")
    print(f"http://127.0.0.1:5500/Front%20End/recover/recover.html?token={token}")

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
