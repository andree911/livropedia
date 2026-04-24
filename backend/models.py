from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Livro(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(100), nullable=False)
    autor = db.Column(db.String(100), nullable=False)
    resumo = db.Column(db.Text)
    capa_url = db.Column(db.String(250))

    capa_usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "titulo": self.titulo,
            "autor": self.autor,
            "resumo": self.resumo,
            "capa_url": self.capa_url,
            "capa_usuario_id": self.capa_usuario_id
        }

class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha = db.Column(db.String(200), nullable= False)
    nome = db.Column(db.String(100))