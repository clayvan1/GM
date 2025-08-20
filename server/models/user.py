from extension import db
from datetime import datetime
from sqlalchemy_serializer import SerializerMixin


class User(db.Model, SerializerMixin):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default=None)  # None until superadmin assigns
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # debts recorded by this user (employee or superadmin)
    debts = db.relationship("Debt", backref="recorder", lazy=True)

    # prevent recursion: do not serialize recorder inside debts
    serialize_rules = ("-debts.recorder",)

    def is_superadmin(self):
        return self.role == "superadmin"

    def is_employee(self):
        return self.role == "employee"
