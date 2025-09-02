# flask_api/joint_bp.py
from flask import Blueprint, request
from flask_restful import Api, Resource
from extension import db
from models.joint import Joint
from models.inventory import Inventory
from models.sale import Sale
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

joint_bp = Blueprint("joint", __name__)
joint_api = Api(joint_bp)

# --- Helper to convert UTC to local time ---
def utc_to_local(dt, tz="Africa/Nairobi"):
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(ZoneInfo(tz)).strftime("%Y-%m-%d %H:%M:%S")

# -------------------- List & Create --------------------
class JointListCreate(Resource):
    def get(self):
        try:
            joints = Joint.query.all()
            data = []
            for j in joints:
                d = j.to_dict()
                d["created_at"] = utc_to_local(j.created_at)
                d["ended_at"] = utc_to_local(j.ended_at)
                data.append(d)
            return {"joints": data}, 200
        except Exception as e:
            return {"error": str(e)}, 500

    def post(self):
        data = request.get_json() or {}
        required = ["inventory_id", "grams_used", "joints_count", "price_per_joint"]
        missing = [f for f in required if not data.get(f)]
        if missing:
            return {"error": f"Missing required fields: {', '.join(missing)}"}, 400

        try:
            inventory = Inventory.query.get(int(data["inventory_id"]))
            if not inventory:
                return {"error": "Inventory not found"}, 404

            grams_to_use = float(data["grams_used"])
            if inventory.grams_available < grams_to_use:
                return {"error": "Not enough grams in inventory"}, 400

            # Subtract grams and handle auto-end
            inventory.grams_available -= grams_to_use
            if inventory.grams_available <= 0 and inventory.ended_at is None:
                inventory.grams_available = 0
                inventory.ended_at = datetime.utcnow()

            # Create joint
            joint = Joint(
                inventory_id=inventory.id,
                grams_used=grams_to_use,
                joints_count=int(data["joints_count"]),
                price_per_joint=float(data["price_per_joint"]),
                assigned_to=data.get("assigned_to"),
                sold_price=0.0  # Sales handled separately
            )

            db.session.add_all([inventory, joint])
            db.session.commit()

            joint_dict = joint.to_dict()
            joint_dict["created_at"] = utc_to_local(joint.created_at)
            joint_dict["ended_at"] = utc_to_local(joint.ended_at)

            return {"message": "Joint created and inventory updated", "joint": joint_dict}, 201

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500

# -------------------- Detail & Update & Delete --------------------
class JointDetail(Resource):
    def put(self, joint_id):
        data = request.get_json() or {}
        joint = Joint.query.get(joint_id)
        if not joint:
            return {"error": "Joint not found"}, 404

        try:
            inventory = Inventory.query.get(joint.inventory_id)
            if not inventory:
                return {"error": "Inventory not found"}, 404

            # --- Update grams used ---
            new_grams_used = data.get("grams_used")
            if new_grams_used is not None:
                new_grams_used = float(new_grams_used)
                # Restore previous grams before applying new value
                inventory.grams_available += joint.grams_used
                if inventory.grams_available < new_grams_used:
                    return {"error": "Not enough grams in inventory"}, 400
                inventory.grams_available -= new_grams_used
                joint.grams_used = new_grams_used

                if inventory.grams_available <= 0 and inventory.ended_at is None:
                    inventory.grams_available = 0
                    inventory.ended_at = datetime.utcnow()

            # --- Handle selling joints separately ---
            sold_qty = int(data.get("sold_qty", 0))
            sold_price = float(data.get("sold_price", 0.0))

            if sold_qty > 0:
                if sold_qty > joint.joints_count:
                    return {"error": "Cannot sell more joints than available"}, 400

                joint.joints_count -= sold_qty
                joint.sold_price += sold_price

                # Auto-end joint if no joints left
                if joint.joints_count <= 0 and joint.ended_at is None:
                    joint.joints_count = 0
                    joint.ended_at = datetime.utcnow()

                # Log sale
                sale = Sale(
                    inventory_id=inventory.id,
                    quantity=sold_qty,
                    sale_type="joints",
                    total_price=sold_price,
                    sold_by=data.get("sold_by") or "system",
                )
                db.session.add(sale)

            # --- Update other joint fields ---
            joint.price_per_joint = data.get("price_per_joint", joint.price_per_joint)
            joint.assigned_to = data.get("assigned_to", joint.assigned_to)

            db.session.add(inventory)  # ensure inventory changes persist
            db.session.commit()

            updated = joint.to_dict()
            updated["created_at"] = utc_to_local(joint.created_at)
            updated["ended_at"] = utc_to_local(joint.ended_at)

            return {"message": "Joint updated and inventory adjusted", "joint": updated}, 200

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500

    def delete(self, joint_id):
        joint = Joint.query.get(joint_id)
        if not joint:
            return {"error": "Joint not found"}, 404
        try:
            db.session.delete(joint)
            db.session.commit()
            return {"message": f"Joint {joint_id} deleted"}, 200
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500

# -------------------- Register Resources --------------------
joint_api.add_resource(JointListCreate, "")  # /api/joints
joint_api.add_resource(JointDetail, "/<int:joint_id>")  # /api/joints/<id>
