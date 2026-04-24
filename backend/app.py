from flask import Flask
from models import db
from flask_jwt_extended import JWTManager
from routes import routes
from flask_cors import CORS
from auth import auth
from users import users
from dotenv import load_dotenv
import os


load_dotenv()

app = Flask(__name__)

UPLOAD_FOLDER = os.path.join("static", "capas")
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///livros.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

db.init_app(app)

app.register_blueprint(auth)

app.register_blueprint(users)

jwt = JWTManager(app)

with app.app_context():
    db.create_all()

routes(app)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)