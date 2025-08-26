from extension import db
from datetime import datetime
from sqlalchemy_serializer import SerializerMixin


class Sale(db.Model, SerializerMixin):
    __tablename__ = "sales"

    id = db.Column(db.Integer, primary_key=True)
    inventory_id = db.Column(db.Integer, db.ForeignKey("inventory.id"), nullable=False)
    quantity = db.Column(db.Float, nullable=False)  # grams or joints
    sale_type = db.Column(db.String(20), nullable=False)  # "grams" or "joints"
    total_price = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    sold_by = db.Column(db.String(50), nullable=True)

    # prevent recursion (avoid inventory → sales → inventory loop)
    serialize_rules = ("-inventory.sales",)
