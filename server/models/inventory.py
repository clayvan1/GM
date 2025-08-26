from extension import db
from datetime import datetime
from sqlalchemy_serializer import SerializerMixin

class Inventory(db.Model, SerializerMixin):
    __tablename__ = "inventory"

    id = db.Column(db.Integer, primary_key=True)
    strain_name = db.Column(db.String(100), nullable=False)
    grams_available = db.Column(db.Float, default=0.0)
    price_per_gram = db.Column(db.Float, nullable=False)
    buying_price = db.Column(db.Float, nullable=False)  # <-- new column
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    ended_at = db.Column(db.DateTime, nullable=True)  # end time
    sold_price = db.Column(db.Float, nullable=True)   # price sold

    joints = db.relationship("Joint", backref="inventory", lazy=True)
    sales = db.relationship("Sale", backref="inventory", lazy=True)

    # Prevent recursion errors
    serialize_rules = ("-joints.inventory", "-sales.inventory",)
