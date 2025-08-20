from flask import Flask
from flask_migrate import Migrate
from extension import db
from dotenv import load_dotenv
import os
import re

# Load environment variables from .env file
load_dotenv()

# Import models so Flask-Migrate can detect them
from models.user import User
from models.inventory import Inventory
from models.joint import Joint
from models.sale import Sale
from models.debt import Debt


def create_app():
    app = Flask(__name__)

    # --- Database Config ---
    raw_url = os.getenv("DATABASE_URL")

    if not raw_url:
        raise RuntimeError("DATABASE_URL is not set in .env")

    # Fix in case the string includes 'DATABASE_URL=' prefix by mistake
    db_url = re.sub(r"^DATABASE_URL=", "", raw_url)

    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "devsecret")

    # --- Init extensions ---
    db.init_app(app)
    Migrate(app, db)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
