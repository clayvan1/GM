from extension import db
from datetime import datetime
from sqlalchemy_serializer import SerializerMixin


class Debt(db.Model, SerializerMixin):
    __tablename__ = "debts"

    id = db.Column(db.Integer, primary_key=True)
    debtor_name = db.Column(db.String(120), nullable=False)  # Not anonymous anymore
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default="unpaid")  # unpaid / paid
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    recorded_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    # Prevent recursion errors: (User has debts -> Debt has recorder -> User again)
    serialize_rules = ("-recorder.debts",)
