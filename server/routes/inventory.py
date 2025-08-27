from flask import Blueprint, request
from flask_restful import Api, Resource
from extension import db
from models.inventory import Inventory
from datetime import datetime

inventory_bp = Blueprint("inventory", __name__)
inventory_api = Api(inventory_bp)

class InventoryListCreate(Resource):
    def get(self):
        inventories = Inventory.query.all()
        data = [inv.to_dict() for inv in inventories]
        return {"inventories": data}, 200

    def post(self):
        data = request.get_json()
        strain_name = data.get("strain_name")
        price_per_gram = data.get("price_per_gram")
        grams_available = data.get("grams_available", 0.0)
        buying_price = data.get("buying_price")
        sold_price = data.get("sold_price")

        if not strain_name or not price_per_gram or buying_price is None:
            return {"error": "strain_name, price_per_gram, and buying_price are required"}, 400

        try:
            ended_at = None
            if grams_available <= 0:
                ended_at = datetime.utcnow()

            inv = Inventory(
                strain_name=strain_name,
                price_per_gram=price_per_gram,
                grams_available=grams_available,
                buying_price=buying_price,
                sold_price=sold_price,
                ended_at=ended_at
            )
            db.session.add(inv)
            db.session.commit()

            return {"message": "Inventory created", "inventory": inv.to_dict()}, 201
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500

class InventoryDetail(Resource):
    def get(self, inventory_id):
        inv = Inventory.query.get(inventory_id)
        if not inv:
            return {"error": "Inventory not found"}, 404
        return {"inventory": inv.to_dict()}, 200

    def put(self, inventory_id):
        inv = Inventory.query.get(inventory_id)
        if not inv:
            return {"error": "Inventory not found"}, 404

        data = request.get_json()
        try:
            inv.strain_name = data.get("strain_name", inv.strain_name)
            inv.price_per_gram = data.get("price_per_gram", inv.price_per_gram)
            inv.buying_price = data.get("buying_price", inv.buying_price)
            inv.sold_price = data.get("sold_price", inv.sold_price)
            inv.grams_available = data.get("grams_available", inv.grams_available)

            if inv.grams_available <= 0 and not inv.ended_at:
                inv.ended_at = datetime.utcnow()
            elif inv.grams_available > 0:
                inv.ended_at = None

            db.session.commit()
            return {"message": "Inventory updated", "inventory": inv.to_dict()}, 200
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500

    def delete(self, inventory_id):
        inv = Inventory.query.get(inventory_id)
        if not inv:
            return {"error": "Inventory not found"}, 404
        try:
            db.session.delete(inv)
            db.session.commit()
            return {"message": "Inventory deleted"}, 200
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500

# Register resources
inventory_api.add_resource(InventoryListCreate, "/")
inventory_api.add_resource(InventoryDetail, "/<int:inventory_id>")
