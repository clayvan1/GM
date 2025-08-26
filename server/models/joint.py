from extension import db
from datetime import datetime
from sqlalchemy_serializer import SerializerMixin

class Joint(db.Model, SerializerMixin):
    __tablename__ = "joints"

    id = db.Column(db.Integer, primary_key=True)
    inventory_id = db.Column(db.Integer, db.ForeignKey("inventory.id"), nullable=False)
    grams_used = db.Column(db.Float, nullable=False)
    joints_count = db.Column(db.Integer, nullable=False)
    price_per_joint = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    ended_at = db.Column(db.DateTime, nullable=True)  # end time
    assigned_to = db.Column(db.String(100), nullable=True)  # employee
    sold_price = db.Column(db.Float, nullable=True)  # <-- new column for the price it was sold at

    # Prevent recursion: avoid inventory -> joints -> inventory loops
    serialize_rules = ("-inventory.joints",)
