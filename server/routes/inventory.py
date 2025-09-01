# flask_api/inventory_bp.py
from flask import Blueprint, request
from flask_restful import Api, Resource
from extension import db
from models.inventory import Inventory
from models.sale import Sale
from datetime import datetime, timezone
from zoneinfo import ZoneInfo  # Python 3.9+

inventory_bp = Blueprint("inventory", __name__)
inventory_api = Api(inventory_bp)

# --- Helper to convert UTC to local time ---
def utc_to_local(dt, tz="Africa/Nairobi"):
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(ZoneInfo(tz)).strftime("%Y-%m-%d %H:%M:%S")


class InventoryListCreate(Resource):
    def get(self):
        try:
            inventories = Inventory.query.all()
            data = []
            for inv in inventories:
                d = inv.to_dict()
                d["created_at"] = utc_to_local(inv.created_at)
                d["ended_at"] = utc_to_local(inv.ended_at)
                data.append(d)
            return {"inventories": data}, 200
        except Exception as e:
            return {"error": str(e)}, 500

    def post(self):
        data = request.get_json() or {}
        strain_name = data.get("strain_name")
        price_per_gram = data.get("price_per_gram")
        grams_available = data.get("grams_available", 0)
        buying_price = data.get("buying_price")
        sold_price = data.get("sold_price")

        if not strain_name or price_per_gram is None or buying_price is None:
            return {"error": "strain_name, price_per_gram, and buying_price are required"}, 400

        try:
            ended_at = None
            # Only set ended_at if grams_available is explicitly 0
            if grams_available == 0:
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

            inv_dict = inv.to_dict()
            inv_dict["created_at"] = utc_to_local(inv.created_at)
            inv_dict["ended_at"] = utc_to_local(inv.ended_at)

            return {"message": "Inventory created", "inventory": inv_dict}, 201

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500
class InventoryDetail(Resource):
    def put(self, inventory_id):
        data = request.get_json()
        inventory = Inventory.query.get(inventory_id)
        if not inventory:
            return {"error": "Inventory not found"}, 404

        try:
            # Manual force end
            if data.get("force_end") and inventory.ended_at is None:
                inventory.ended_at = datetime.utcnow()

            # Normal sale/usage updates
            quantity_sold = data.get("quantity_sold")
            sold_price_input = data.get("sold_price")

            if quantity_sold:
                quantity_sold = float(quantity_sold)
                if inventory.grams_available < quantity_sold:
                    return {"error": "Not enough stock"}, 400

                inventory.grams_available -= quantity_sold
                if sold_price_input:
                    inventory.sold_price = (inventory.sold_price or 0) + float(sold_price_input)

                # Auto end when grams hit 0
                if inventory.grams_available <= 0 and inventory.ended_at is None:
                    inventory.ended_at = datetime.utcnow()

            # Optional manual updates
            inventory.strain_name = data.get("strain_name", inventory.strain_name)
            inventory.price_per_gram = data.get("price_per_gram", inventory.price_per_gram)
            inventory.buying_price = data.get("buying_price", inventory.buying_price)

            db.session.commit()

            updated = inventory.to_dict()
            updated["created_at"] = utc_to_local(inventory.created_at)
            updated["ended_at"] = utc_to_local(inventory.ended_at)

            return {"message": "Inventory updated", "inventory": updated}, 200

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500


# Register resources
inventory_api.add_resource(InventoryListCreate, "/")
inventory_api.add_resource(InventoryDetail, "/<int:inventory_id>")
