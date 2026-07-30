from flask import Flask
from models import db
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate, upgrade
from routes import routes
from flask_cors import CORS
from auth import auth
from users import users
from avaliacoes import avaliacoes
from livros_externos import livros_externos
from listas import listas
from dotenv import load_dotenv
import os


load_dotenv()

app = Flask(__name__)

UPLOAD_FOLDER = os.path.join("static", "capas")
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

CORS(app)

database_url = os.getenv("DATABASE_URL", "sqlite:///livros.db")
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["GOOGLE_CLIENT_ID"] = os.getenv("GOOGLE_CLIENT_ID")

db.init_app(app)
migrate = Migrate(app, db)

# Aplica migrations pendentes no boot, pra nao depender de um Build Command
# manual no Render (e pra Postgres novo/vazio ja subir com o schema certo).
with app.app_context():
    upgrade()

app.register_blueprint(auth)

app.register_blueprint(users)

app.register_blueprint(avaliacoes)

app.register_blueprint(livros_externos)

app.register_blueprint(listas)

jwt = JWTManager(app)

routes(app)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)