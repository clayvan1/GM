# app.py
from flask import Flask
from flask_migrate import Migrate
from extension import db
from dotenv import load_dotenv
import os
import re
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta

# Load environment variables
load_dotenv()

# Import models
from models.user import User
from models.inventory import Inventory
from models.joint import Joint
from models.sale import Sale
from models.debt import Debt

# Import blueprints
from routes.user import user_bp
from routes.inventory import inventory_bp
from routes.joint import joint_bp
from routes.sale import sale_bp
from routes.debt import debt_bp

def create_app():
    app = Flask(__name__)

    # --- Database Config ---
    raw_url = os.getenv("DATABASE_URL")
    if not raw_url:
        raise RuntimeError("DATABASE_URL is not set in .env")
    db_url = re.sub(r"^DATABASE_URL=", "", raw_url)
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "devsecret")

    # --- JWT Config: tokens valid for 2 hours ---
    app.config["JWT_SECRET_KEY"] = app.config["SECRET_KEY"]
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

    # --- Init extensions ---
    db.init_app(app)
    Migrate(app, db)
    jwt = JWTManager(app)

    # --- Enable global CORS ---
    CORS(app)

    # --- Register Blueprints ---
    app.register_blueprint(user_bp, url_prefix="/api/users")
    app.register_blueprint(inventory_bp, url_prefix="/api/inventory")
    app.register_blueprint(joint_bp, url_prefix="/api/joints")
    app.register_blueprint(sale_bp, url_prefix="/api/sales")
    app.register_blueprint(debt_bp, url_prefix="/api/debts")

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
