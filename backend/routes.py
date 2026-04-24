from flask import request, jsonify
from models import Livro, db
from sqlalchemy import func
from flask_jwt_extended import jwt_required, get_jwt_identity
import uuid
from werkzeug.utils import secure_filename
import os

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

def allowed_file(filename):
    return "." in filename and \
        filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def routes(app):
    @jwt_required()
    @app.route('/livros', methods=['GET'])

    def obter_livros():
        livros = Livro.query.all()
        return jsonify([l.to_dict() for l in livros])


    @app.route('/livros/id/<int:id>',methods=['GET'])

    def obter_livro_por_id(id):

        livro = Livro.query.get(id)

        if not livro:
            return jsonify({"erro": "livro nao encontrado"}), 404
        return jsonify(livro.to_dict())

    @app.route('/livros/titulo/<string:titulo>', methods=['GET'])
    def obter_livro_por_titulo(titulo):
        
        livros = Livro.query.filter(
            Livro.titulo.ilike(f"%{titulo}%")
            ).all()

        if not livros:
            return {"erro": "Livro não encontrado"}, 404
        
        return [
            {
                "id": livro.id,
                "titulo": livro.titulo,
                "autor": livro.autor
            }
            for livro in livros
        ]

    @app.route('/livros/<int:id>' ,methods=['PUT'])

    def editar_livro_por_id(id):

        livro = Livro.query.get(id)

        if not livro:
            return jsonify({"erro": "livro nao encontrado"}), 404
        
        dados = request.json

        if "titulo" in dados:
            livro.titulo = dados["titulo"]

        if "autor" in dados:
            livro.autor = dados["autor"]

        if "resumo" in dados:
            livro.resumo = dados["resumo"]

        db.session.commit()

        return jsonify(livro.to_dict())

    
    @app.route('/livros' ,methods=['POST'])

    def incluir_novo_livro():

        dados = request.get_json()

        titulo = dados.get("titulo")
        autor = dados.get("autor")

        if not titulo or not autor:
            return {
                "erro": "titulo e autor não informados"
            }, 400

        novo = Livro(
            titulo = dados["titulo"],
            autor = dados["autor"]
        )

        db.session.add(novo)
        db.session.commit()

        return jsonify(novo.to_dict()), 201

    @app.route('/livros/<int:id>', methods=['DELETE'])

    def excluir_livro(id):

        livro = Livro.query.get(id)

        if not livro:
            return jsonify({"erro": "livro nao encontrado"}), 404

        db.session.delete(livro)
        db.session.commit()

        return jsonify({"message": "livro deletado com sucesso"})
    
    
    @app.route("/livros/<int:id>/upload_capa", methods=["POST"])
    @jwt_required()
    def upload_capa(id):

        livro = Livro.query.get(id)
        if not livro:
            return jsonify({"erro": "Livro não encontrado"}), 404
        
        usuario_id = get_jwt_identity()

        if livro.capa_usuario_id and livro.capa_usuario_id != usuario_id:
            return jsonify({
            "erro": "Apenas quem enviou a capa pode alterá-la"
        }), 403

        if "capa" not in request.files:
            return jsonify({"erro": "Nenhum arquivo enviado"}), 400

        file = request.files["capa"]

        if file.filename == "":
            return jsonify({"erro": "Arquivo inválido"}), 400

        if not allowed_file(file.filename):
            return jsonify({"erro": "Formato não permitido"}), 400

        os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

        filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"

        caminho_arquivo = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(caminho_arquivo)

        livro.capa_url = f"/static/capas/{filename}"

        livro.capa_usuario_id = usuario_id

        db.session.commit()

        return jsonify({
            "mensagem": "Capa enviada com sucesso",
            "capa_url": livro.capa_url
        })