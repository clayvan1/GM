from flask import Blueprint, request
from flask_restful import Api, Resource
from extension import db
from models.sale import Sale
from models.inventory import Inventory  # ✅ link to inventory model

# --- Blueprint & API setup ---
sale_bp = Blueprint("sale", __name__)
sale_api = Api(sale_bp)


# --- List & Create Sales ---
class SaleListCreate(Resource):
    def get(self):
        """Fetch all sales"""
        sales = Sale.query.all()
        return {"sales": [s.to_dict() for s in sales]}, 200

    def post(self):
        """Create a new sale & update inventory"""
        data = request.get_json()
        inventory_id = data.get("inventory_id")
        quantity = data.get("quantity")
        sale_type = data.get("sale_type")  # "grams" or "joints"
        total_price = data.get("total_price")
        sold_by = data.get("sold_by")

        # ✅ Validation
        if not all([inventory_id, quantity, sale_type, total_price]):
            return {"error": "All fields required"}, 400

        try:
            # ✅ 1. Find inventory
            inv = Inventory.query.get(inventory_id)
            if not inv:
                return {"error": "Inventory not found"}, 404

            # ✅ 2. Check stock before selling
            if sale_type == "grams":
                if inv.grams_available < quantity:
                    return {"error": "Not enough grams available"}, 400
                inv.grams_available -= quantity
            elif sale_type == "joints":
                if inv.joints_available < quantity:
                    return {"error": "Not enough joints available"}, 400
                inv.joints_available -= quantity
            else:
                return {"error": "Invalid sale_type. Use 'grams' or 'joints'"}, 400

            # ✅ 3. Create sale record
            sale = Sale(
                inventory_id=inventory_id,
                quantity=quantity,
                sale_type=sale_type,
                total_price=total_price,
                sold_by=sold_by
            )

            db.session.add(sale)
            db.session.commit()

            return {"message": "Sale recorded", "sale": sale.to_dict()}, 201

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500


# --- Sale Detail (Get/Delete) ---
class SaleDetail(Resource):
    def get(self, sale_id):
        """Fetch a single sale by ID"""
        sale = Sale.query.get(sale_id)
        if not sale:
            return {"error": "Sale not found"}, 404
        return sale.to_dict(), 200

    def delete(self, sale_id):
        """Delete a sale (does NOT restore inventory)"""
        sale = Sale.query.get(sale_id)
        if not sale:
            return {"error": "Sale not found"}, 404

        try:
            db.session.delete(sale)
            db.session.commit()
            return {"message": "Sale deleted"}, 200
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500


# --- Register Resources ---
sale_api.add_resource(SaleListCreate, "/")
sale_api.add_resource(SaleDetail, "/<int:sale_id>")
