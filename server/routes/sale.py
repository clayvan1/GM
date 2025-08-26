from flask import Blueprint, request
from flask_restful import Api, Resource
from extension import db
from models.sale import Sale

sale_bp = Blueprint("sale", __name__)
sale_api = Api(sale_bp)

class SaleListCreate(Resource):
    def get(self):
        sales = Sale.query.all()
        return {"sales": [s.to_dict() for s in sales]}, 200

    def post(self):
        data = request.get_json()
        inventory_id = data.get("inventory_id")
        quantity = data.get("quantity")
        sale_type = data.get("sale_type")
        total_price = data.get("total_price")
        if not all([inventory_id, quantity, sale_type, total_price]):
            return {"error": "All fields required"}, 400
        try:
            sale = Sale(
                inventory_id=inventory_id,
                quantity=quantity,
                sale_type=sale_type,
                total_price=total_price
            )
            db.session.add(sale)
            db.session.commit()
            return {"message": "Sale recorded", "sale": sale.to_dict()}, 201
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500

class SaleDetail(Resource):
    def get(self, sale_id):
        sale = Sale.query.get(sale_id)
        if not sale:
            return {"error": "Sale not found"}, 404
        return sale.to_dict(), 200

    def delete(self, sale_id):
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

# Register resources
sale_api.add_resource(SaleListCreate, "/")
sale_api.add_resource(SaleDetail, "/<int:sale_id>")
