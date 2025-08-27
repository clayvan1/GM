from flask import Blueprint, request, current_app
from flask_restful import Api, Resource
from extension import db, bcrypt
from models.user import User

# Create a Blueprint
user_bp = Blueprint("user", __name__)
user_api = Api(user_bp)  # Attach RESTful API to Blueprint

# --- Resources ---
class UserList(Resource):
    def get(self):
        try:
            users = User.query.all()
            data = [u.to_dict() for u in users]
            return {"users": data}, 200
        except Exception as e:
            current_app.logger.error(f"Failed to fetch users: {str(e)}")
            return {"error": f"Failed to fetch users: {str(e)}"}, 500

class Signup(Resource):
    def post(self):
        data = request.get_json()
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")

        if not username or not email or not password:
            return {"error": "All fields required"}, 400

        try:
            if User.query.filter_by(email=email).first():
                return {"error": "Email already exists"}, 400

            is_first_user = User.query.count() == 0
            role = "superadmin" if is_first_user else None

            hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
            user = User(username=username, email=email, password=hashed_password, role=role)
            db.session.add(user)
            db.session.commit()

            return {
                "message": f"User created{' as superadmin' if is_first_user else ' with no role assigned'}.",
                "user": user.to_dict()
            }, 201
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Signup failed: {str(e)}")
            return {"error": f"Failed to create user: {str(e)}"}, 500

class Login(Resource):
    def post(self):
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")

        user = User.query.filter_by(email=email).first()
        if not user:
            return {"error": "Invalid email or password"}, 401

        try:
            if not bcrypt.check_password_hash(user.password, password):
                return {"error": "Invalid email or password"}, 401
        except ValueError:
            return {"error": "Password hash is invalid"}, 500

        return {"message": "Login successful", "user": user.to_dict()}, 200

class UpdateUserRole(Resource):
    def put(self, user_id):
        data = request.get_json()
        new_role = data.get("role")
        if new_role not in ["employee", "superadmin", None]:
            return {"error": "Invalid role"}, 400

        user = User.query.get(user_id)
        if not user:
            return {"error": "User not found"}, 404

        if user.is_superadmin() and new_role != "superadmin":
            return {"error": "Cannot downgrade the superadmin"}, 400

        try:
            user.role = new_role
            db.session.commit()
            return {"message": f"User role updated to {new_role}", "user": user.to_dict()}, 200
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Update role failed: {str(e)}")
            return {"error": f"Failed to update user role: {str(e)}"}, 500

# --- Register resources ---
user_api.add_resource(Signup, "/signup")
user_api.add_resource(Login, "/login")
user_api.add_resource(UpdateUserRole, "/<int:user_id>/role")
user_api.add_resource(UserList, "/all")
