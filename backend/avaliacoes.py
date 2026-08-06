from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from models import db, Livro, Avaliacao

avaliacoes = Blueprint("avaliacoes", __name__)


def _recalcular_nota_media(livro_id):
    resultado = db.session.query(
        func.avg(Avaliacao.nota),
        func.count(Avaliacao.id)
    ).filter(Avaliacao.livro_id == livro_id).one()

    media, total = resultado

    livro = Livro.query.get(livro_id)
    livro.nota_media = round(media, 2) if media is not None else 0
    livro.total_avaliacoes = total
    db.session.commit()


@avaliacoes.route("/livros/<int:livro_id>/avaliacoes", methods=["GET"])
def listar_avaliacoes(livro_id):
    if not Livro.query.get(livro_id):
        return jsonify({"erro": "Livro não encontrado"}), 404

    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 50)

    paginado = Avaliacao.query.filter_by(livro_id=livro_id) \
        .order_by(Avaliacao.criado_em.desc()) \
        .paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "avaliacoes": [a.to_dict() for a in paginado.items],
        "total": paginado.total,
        "page": paginado.page,
        "per_page": per_page
    })


@avaliacoes.route("/livros/<int:livro_id>/minha-avaliacao", methods=["GET"])
@jwt_required()
def minha_avaliacao(livro_id):
    usuario_id = int(get_jwt_identity())

    avaliacao = Avaliacao.query.filter_by(
        livro_id=livro_id, usuario_id=usuario_id
    ).first()

    return jsonify({"avaliacao": avaliacao.to_dict() if avaliacao else None})


@avaliacoes.route("/livros/<int:livro_id>/avaliacoes", methods=["POST"])
@jwt_required()
def criar_ou_atualizar_avaliacao(livro_id):
    if not Livro.query.get(livro_id):
        return jsonify({"erro": "Livro não encontrado"}), 404

    dados = request.get_json() or {}
    nota = dados.get("nota")

    if nota is None or not isinstance(nota, int) or not (1 <= nota <= 5):
        return jsonify({"erro": "nota é obrigatória e deve ser um inteiro entre 1 e 5"}), 400

    usuario_id = int(get_jwt_identity())

    avaliacao = Avaliacao.query.filter_by(
        livro_id=livro_id, usuario_id=usuario_id
    ).first()

    if avaliacao:
        avaliacao.nota = nota
        avaliacao.resenha = dados.get("resenha")
    else:
        avaliacao = Avaliacao(
            livro_id=livro_id,
            usuario_id=usuario_id,
            nota=nota,
            resenha=dados.get("resenha")
        )
        db.session.add(avaliacao)

    db.session.commit()

    _recalcular_nota_media(livro_id)

    return jsonify(avaliacao.to_dict()), 200


@avaliacoes.route("/avaliacoes/<int:avaliacao_id>", methods=["DELETE"])
@jwt_required()
def apagar_avaliacao(avaliacao_id):
    avaliacao = Avaliacao.query.get(avaliacao_id)

    if not avaliacao:
        return jsonify({"erro": "Avaliação não encontrada"}), 404

    usuario_id = int(get_jwt_identity())

    if avaliacao.usuario_id != usuario_id:
        return jsonify({"erro": "Apenas quem criou a avaliação pode apagá-la"}), 403

    livro_id = avaliacao.livro_id

    db.session.delete(avaliacao)
    db.session.commit()

    _recalcular_nota_media(livro_id)

    return jsonify({"mensagem": "Avaliação apagada com sucesso"})
