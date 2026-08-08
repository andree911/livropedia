from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Livro, Avaliacao, Lista, ListaItem

estatisticas = Blueprint("estatisticas", __name__)


@estatisticas.route("/estatisticas", methods=["GET"])
@jwt_required()
def obter_estatisticas():
    usuario_id = int(get_jwt_identity())

    lista_lido = Lista.query.filter_by(usuario_id=usuario_id, nome="Lido").first()

    livros_lidos = []
    if lista_lido:
        livros_lidos = (
            db.session.query(Livro, ListaItem.adicionado_em)
            .join(ListaItem, ListaItem.livro_id == Livro.id)
            .filter(ListaItem.lista_id == lista_lido.id)
            .all()
        )

    lidos_por_ano = {}
    lidos_por_autor = {}

    for livro, adicionado_em in livros_lidos:
        if adicionado_em:
            ano = adicionado_em.year
            lidos_por_ano[ano] = lidos_por_ano.get(ano, 0) + 1

        lidos_por_autor[livro.autor] = lidos_por_autor.get(livro.autor, 0) + 1

    autores_mais_lidos = sorted(
        lidos_por_autor.items(), key=lambda item: item[1], reverse=True
    )[:5]

    avaliacoes = Avaliacao.query.filter_by(usuario_id=usuario_id).all()
    distribuicao_notas = {n: 0 for n in range(1, 6)}
    for avaliacao in avaliacoes:
        distribuicao_notas[avaliacao.nota] = distribuicao_notas.get(avaliacao.nota, 0) + 1

    nota_media_dada = (
        round(sum(a.nota for a in avaliacoes) / len(avaliacoes), 2) if avaliacoes else 0
    )

    return jsonify({
        "total_lidos": len(livros_lidos),
        "total_avaliacoes": len(avaliacoes),
        "nota_media_dada": nota_media_dada,
        "lidos_por_ano": dict(sorted(lidos_por_ano.items())),
        "distribuicao_notas": distribuicao_notas,
        "autores_mais_lidos": [
            {"autor": autor, "total": total} for autor, total in autores_mais_lidos
        ],
    })
