import os
import re
import logging
from datetime import timedelta

from flask import Flask, jsonify
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_caching import Cache
from dotenv import load_dotenv

from extension import db, bcrypt

# Load environment variables
load_dotenv()

# Import models (needed for migrations)
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

# Cache instance
cache = Cache()


def normalize_db_url(url: str) -> str:
    """Normalize and ensure sslmode=require in DB URLs."""
    url = url.replace(" ", "%20")
    if "sslmode" not in url:
        if "?" in url:
            url += "&sslmode=require"
        else:
            url += "?sslmode=require"
    return url


def create_app():
    app = Flask(__name__)

    # --- Database Config (Supabase/PostgreSQL) ---
    raw_url = os.getenv("MIGRATION_URL") or os.getenv("DATABASE_URL")
    if not raw_url:
        raise RuntimeError("❌ DATABASE_URL or MIGRATION_URL must be set in .env")

    db_url = normalize_db_url(raw_url)
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # --- Security / Secrets ---
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", os.urandom(24))

    # --- JWT Config ---
    app.config["JWT_SECRET_KEY"] = app.config["SECRET_KEY"]
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)
    JWTManager(app)

    # --- Cache Config (Redis if available, fallback to SimpleCache) ---
    if os.getenv("REDIS_URL"):
        app.config["CACHE_TYPE"] = "RedisCache"
        app.config["CACHE_REDIS_URL"] = os.getenv("REDIS_URL")
    else:
        app.config["CACHE_TYPE"] = "SimpleCache"  # fallback for local/dev
    cache.init_app(app)

    # --- Init extensions ---
    db.init_app(app)
    Migrate(app, db)
    bcrypt.init_app(app)

    # --- Enable global CORS ---
    CORS(app, resources={r"/api/*": {"origins": os.getenv("CORS_ORIGINS", "*")}})

    # --- Register Blueprints ---
    app.register_blueprint(user_bp, url_prefix="/api/users")
    app.register_blueprint(inventory_bp, url_prefix="/api/inventory")
    app.register_blueprint(joint_bp, url_prefix="/api/joints")
    app.register_blueprint(sale_bp, url_prefix="/api/sales")
    app.register_blueprint(debt_bp, url_prefix="/api/debts")

    # --- Health Check Route (for Render) ---
    @app.route("/healthz")
    def health():
        return jsonify({"status": "ok"}), 200

    # --- Logging Config ---
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    return app


# Entry point for WSGI servers (Gunicorn, uWSGI, etc.)
app = create_app()

# Optional: allow running locally with python app.py
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
