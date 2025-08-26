from app import create_app
from extension import db, bcrypt
from models.user import User
from models.inventory import Inventory
from models.joint import Joint
from models.sale import Sale
import random
from datetime import datetime, timedelta

app = create_app()

def random_date(start, end):
    """Generate a random datetime between start and end."""
    return start + timedelta(seconds=random.randint(0, int((end - start).total_seconds())))

with app.app_context():
    # Drop all tables
    db.drop_all()
    print("All tables dropped.")

    # Recreate all tables
    db.create_all()
    print("All tables created.")

    # === Users ===
    superadmin = User(
        username="superadmin",
        email="admin@example.com",
        password=bcrypt.generate_password_hash("adminpass").decode("utf-8"),
        role="superadmin"
    )
    employee1 = User(
        username="employee1",
        email="employee1@example.com",
        password=bcrypt.generate_password_hash("employeepass").decode("utf-8"),
        role="employee"
    )
    employee2 = User(
        username="employee2",
        email="employee2@example.com",
        password=bcrypt.generate_password_hash("employeepass").decode("utf-8"),
        role="employee"
    )

    db.session.add_all([superadmin, employee1, employee2])
    db.session.commit()
    print("Users seeded successfully!")

    # === Inventories ===
    strains = ["Durban", "Kush", "OG Kush", "Blue Dream", "White Widow"]
    inventories = []
    for i in range(5):  # generate 5 inventories
        grams_available = random.randint(500, 5000)
        price_per_gram = random.randint(30, 100)
        buying_price = grams_available * price_per_gram
        inv = Inventory(
            strain_name=strains[i],
            grams_available=grams_available,
            price_per_gram=price_per_gram,
            buying_price=buying_price,
            created_at=datetime.now()
        )
        inventories.append(inv)
    db.session.add_all(inventories)
    db.session.commit()
    print("Inventories seeded successfully!")

    # === Joints ===
    joints = []
    for inv in inventories:
        num_joints = random.randint(10, 50)
        max_grams = max(50, int(inv.grams_available // 2))  # ensure int and >=50
        grams_used = random.randint(50, max_grams)
        joint_price = random.randint(100, 500)
        assigned_to = random.choice([employee1.id, employee2.id, None])
        joint = Joint(
            inventory_id=inv.id,
            joints_count=num_joints,
            grams_used=grams_used,
            price_per_joint=joint_price,
            sold_price=None,
            assigned_to=assigned_to,
            created_at=random_date(datetime.now() - timedelta(days=30), datetime.now())
        )
        joints.append(joint)
        inv.grams_available -= grams_used  # reduce inventory
    db.session.add_all(joints)
    db.session.commit()
    print("Joints seeded successfully!")

    # === Sales ===
    sales = []
    for inv in inventories:
        num_sales = random.randint(1, 5)
        for _ in range(num_sales):
            quantity = random.randint(1, 20)
            sale_type = random.choice(["joints", "grams"])
            total_price = 0
            if sale_type == "grams":
                quantity = min(quantity, inv.grams_available)  # avoid negative
                total_price = quantity * inv.price_per_gram
                inv.grams_available -= quantity
            else:
                joint = random.choice(joints)
                total_price = quantity * joint.price_per_joint
            sale = Sale(
                inventory_id=inv.id,
                sale_type=sale_type,
                quantity=quantity,
                total_price=total_price,
                sold_by=random.choice([employee1.id, employee2.id]),
                created_at=random_date(datetime.now() - timedelta(days=30), datetime.now())
            )
            sales.append(sale)
    db.session.add_all(sales)
    db.session.commit()
    print("Sales seeded successfully!")

    print("Database seeding complete with inventories, joints, and sales!")
