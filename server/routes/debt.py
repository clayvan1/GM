from flask import Blueprint, request
from flask_restful import Api, Resource
from extension import db
from models.debt import Debt
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User

debt_bp = Blueprint("debt", __name__)
debt_api = Api(debt_bp)

def get_current_user():
    user_id = get_jwt_identity()
    return User.query.get(user_id)

class DebtListCreate(Resource):
    @jwt_required()
    def get(self):
        debts = Debt.query.all()
        return {"debts": [d.to_dict() for d in debts]}, 200

    @jwt_required()
    def post(self):
        data = request.get_json()
        debtor_name = data.get("debtor_name")
        amount = data.get("amount")
        if not debtor_name or amount is None:
            return {"error": "debtor_name and amount required"}, 400
        try:
            current_user = get_current_user()
            debt = Debt(debtor_name=debtor_name, amount=amount, recorder_id=current_user.id)
            db.session.add(debt)
            db.session.commit()
            return {"message": "Debt recorded", "debt": debt.to_dict()}, 201
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500

class DebtDetail(Resource):
    def get(self, debt_id):
        debt = Debt.query.get(debt_id)
        if not debt:
            return {"error": "Debt not found"}, 404
        return debt.to_dict(), 200

    def delete(self, debt_id):
        debt = Debt.query.get(debt_id)
        if not debt:
            return {"error": "Debt not found"}, 404
        try:
            db.session.delete(debt)
            db.session.commit()
            return {"message": "Debt deleted"}, 200
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500

# Register resources
debt_api.add_resource(DebtListCreate, "/")
debt_api.add_resource(DebtDetail, "/<int:debt_id>")
