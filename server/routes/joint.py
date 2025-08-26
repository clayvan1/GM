# joint.py
from flask import Blueprint, request, jsonify
from flask_restful import Api, Resource
from extension import db
from models.joint import Joint
from models.inventory import Inventory
from models.sale import Sale

joint_bp = Blueprint("joint", __name__)
joint_api = Api(joint_bp)

class JointListCreate(Resource):
    def get(self):
        """Return all joints"""
        joints = Joint.query.all()
        return {"joints": [j.to_dict() for j in joints]}, 200

    def post(self):
        """Create a new joint and deduct grams from inventory"""
        data = request.get_json()
        required_fields = ["inventory_id", "grams_used", "joints_count", "price_per_joint"]
        missing_fields = [f for f in required_fields if f not in data or data[f] in [None, ""]]
        if missing_fields:
            return {"error": f"Missing required fields: {', '.join(missing_fields)}"}, 400

        try:
            inventory = Inventory.query.get(int(data["inventory_id"]))
            if not inventory:
                return {"error": "Inventory not found"}, 404

            grams_to_use = float(data["grams_used"])
            if inventory.grams_available < grams_to_use:
                return {"error": "Not enough grams in inventory"}, 400

            # Deduct grams from inventory
            inventory.grams_available -= grams_to_use

            joint = Joint(
                inventory_id=inventory.id,
                grams_used=grams_to_use,
                joints_count=int(data["joints_count"]),
                price_per_joint=float(data["price_per_joint"]),
                assigned_to=str(data.get("assigned_to")) if data.get("assigned_to") else None,
                sold_price=float(data.get("sold_price", 0.0)),
            )

            db.session.add(joint)
            db.session.commit()

            return {"message": "Joint created", "joint": joint.to_dict()}, 201

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500


class JointDetail(Resource):
    def get(self, joint_id):
        """Get joint by ID"""
        joint = Joint.query.get(joint_id)
        if not joint:
            return {"error": "Joint not found"}, 404
        return joint.to_dict(), 200

    def put(self, joint_id):
        """Update joint: sell or assign employee"""
        joint = Joint.query.get(joint_id)
        if not joint:
            return {"error": "Joint not found"}, 404

        data = request.get_json()
        try:
            # Selling joints
            sold_qty = int(data.get("sold_qty", 0))
            sold_price = float(data.get("sold_price", 0.0))
            sold_by = str(data.get("sold_by", ""))  # person executing the sale

            if sold_qty > 0 and sold_price > 0:
                # Update joint count and sold price
                joint.joints_count = max(joint.joints_count - sold_qty, 0)
                joint.sold_price = (joint.sold_price or 0.0) + sold_price

                # Create a Sale record
                sale = Sale(
                    inventory_id=joint.inventory_id,
                    quantity=sold_qty,
                    total_price=sold_price,
                    sale_type="joints",
                    sold_by=sold_by
                )
                db.session.add(sale)

            # Update assigned employee if provided
            if "assigned_to" in data:
                joint.assigned_to = str(data["assigned_to"]) if data["assigned_to"] else None

            db.session.commit()
            return {"message": "Joint updated", "joint": joint.to_dict()}, 200

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500

    def delete(self, joint_id):
        """Delete a joint"""
        joint = Joint.query.get(joint_id)
        if not joint:
            return {"error": "Joint not found"}, 404

        try:
            db.session.delete(joint)
            db.session.commit()
            return {"message": "Joint deleted"}, 200
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500


class JointsByEmployee(Resource):
    def get(self, employee_id):
        """Fetch all joints assigned to a specific employee"""
        joints = Joint.query.filter_by(assigned_to=str(employee_id)).all()
        return {"joints": [j.to_dict() for j in joints]}, 200


# Register resources
joint_api.add_resource(JointListCreate, "/")
joint_api.add_resource(JointDetail, "/<int:joint_id>")
joint_api.add_resource(JointsByEmployee, "/employee/<employee_id>")
