from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Livro(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(100), nullable=False)
    autor = db.Column(db.String(100), nullable=False)
    resumo = db.Column(db.Text)
    capa_url = db.Column(db.String(250))

    capa_usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=True)

    fonte_externa = db.Column(db.String(30), nullable=True)
    external_id = db.Column(db.String(100), nullable=True)
    isbn = db.Column(db.String(20), nullable=True)
    ano_publicacao = db.Column(db.Integer, nullable=True)

    nota_media = db.Column(db.Float, nullable=False, default=0)
    total_avaliacoes = db.Column(db.Integer, nullable=False, default=0)

    __table_args__ = (
        db.UniqueConstraint('external_id', name='uq_livro_external_id'),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "titulo": self.titulo,
            "autor": self.autor,
            "resumo": self.resumo,
            "capa_url": self.capa_url,
            "capa_usuario_id": self.capa_usuario_id,
            "fonte_externa": self.fonte_externa,
            "external_id": self.external_id,
            "isbn": self.isbn,
            "ano_publicacao": self.ano_publicacao,
            "nota_media": self.nota_media,
            "total_avaliacoes": self.total_avaliacoes
        }

class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha = db.Column(db.String(200), nullable=True)
    nome = db.Column(db.String(100))

class Avaliacao(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    livro_id = db.Column(db.Integer, db.ForeignKey('livro.id'), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    nota = db.Column(db.Integer, nullable=False)
    resenha = db.Column(db.Text, nullable=True)
    criado_em = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.UniqueConstraint('livro_id', 'usuario_id', name='uq_avaliacao_livro_usuario'),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "livro_id": self.livro_id,
            "usuario_id": self.usuario_id,
            "nota": self.nota,
            "resenha": self.resenha,
            "criado_em": self.criado_em.isoformat() if self.criado_em else None
        }

class Lista(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    nome = db.Column(db.String(50), nullable=False)

    __table_args__ = (
        db.UniqueConstraint('usuario_id', 'nome', name='uq_lista_usuario_nome'),
    )

class ListaItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    lista_id = db.Column(db.Integer, db.ForeignKey('lista.id'), nullable=False)
    livro_id = db.Column(db.Integer, db.ForeignKey('livro.id'), nullable=False)
    adicionado_em = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.UniqueConstraint('lista_id', 'livro_id', name='uq_lista_item'),
    )
