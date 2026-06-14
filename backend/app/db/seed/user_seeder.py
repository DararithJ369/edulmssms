from sqlalchemy.orm import Session
from app.db.seed.base import BaseSeeder
from app.models.user import User
from app.utils.argon2 import hash_password
from app.utils.colors import Colors


class UserSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, User)

    def seed_admin(self, role_id: int):
        admin = self.db.query(User).filter_by(email="admin@example.com").first()

        if admin:
            return admin

        admin_data = {
            "username": "admin",
            "email": "admin@example.com",
            "hashed_password": hash_password("admin123"),
            "role_id": role_id,
            "is_active": True,
            "is_superuser": True,
            "image": None
        }

        admin = self.create_one(lambda: admin_data, skip_if_exists=False)
        if admin:
            Colors.success(
                f"Admin user created with email: {admin.email} and password: admin123"
            )

        return admin

    def seed_instructor(self, role_id: int):
        # Fallback/default instructor
        instructor = self.db.query(User).filter_by(email="instructor@example.com").first()

        if instructor:
            return instructor
        instructor_data = {
            "username": "instructor",
            "email": "instructor@example.com",
            "hashed_password": hash_password("instructor123"),
            "role_id": role_id,
            "is_active": True,
            "is_superuser": False,
            "image": None
        }

        instructor = self.create_one(lambda: instructor_data, skip_if_exists=False)

        if instructor:
            Colors.success(
                f"Instructor user created with email: {instructor.email} and password: instructor123"
            )

        return instructor

    def seed_instructors(self, role_id: int, count: int = 20):
        instructors = []
        
        # 20 Realistic Cambodian instructor names
        instructor_names = [
            ("Seng", "Dararith", "Dr. Seng Dararith", "dararith.seng@university.edu"),
            ("Chhim", "Vutha", "Prof. Chhim Vutha", "vutha.chhim@university.edu"),
            ("Keo", "Sophal", "Dr. Keo Sophal", "sophal.keo@university.edu"),
            ("Lim", "Socheata", "Prof. Lim Socheata", "socheata.lim@university.edu"),
            ("Chan", "Somally", "Dr. Chan Somally", "somally.chan@university.edu"),
            ("Nguon", "Chanbora", "Prof. Nguon Chanbora", "chanbora.nguon@university.edu"),
            ("Sok", "Chenda", "Dr. Sok Chenda", "chenda.sok@university.edu"),
            ("Tep", "Moniphal", "Prof. Tep Moniphal", "moniphal.tep@university.edu"),
            ("Chea", "Sopheap", "Dr. Chea Sopheap", "sopheap.chea@university.edu"),
            ("Meas", "Serey", "Prof. Meas Serey", "serey.meas@university.edu"),
            ("Ros", "Sarath", "Dr. Ros Sarath", "sarath.ros@university.edu"),
            ("Khorn", "Sovann", "Prof. Khorn Sovann", "sovann.khorn@university.edu"),
            ("Khun", "Borin", "Dr. Khun Borin", "borin.khun@university.edu"),
            ("Long", "Samedy", "Prof. Long Samedy", "samedy.long@university.edu"),
            ("Ouk", "Vutha", "Dr. Ouk Vutha", "vutha.ouk@university.edu"),
            ("Seng", "Vanna", "Prof. Seng Vanna", "vanna.seng@university.edu"),
            ("Touch", "Sophanha", "Dr. Touch Sophanha", "sophanha.touch@university.edu"),
            ("Yim", "Pich", "Prof. Yim Pich", "pich.yim@university.edu"),
            ("Keo", "Rasmey", "Dr. Keo Rasmey", "rasmey.keo@university.edu"),
            ("Hang", "Chunon", "Prof. Hang Chunon", "chunon.hang@university.edu")
        ]

        for i in range(min(count, len(instructor_names))):
            first, last, full_name, email = instructor_names[i]
            username = f"{first.lower()}.{last.lower()}"
            
            # Ensure email uniqueness
            existing = self.db.query(User).filter_by(email=email).first()
            if not existing:
                instructor_data = {
                    "username": username,
                    "email": email,
                    "hashed_password": hash_password(f"{first.lower()}123"),
                    "role_id": role_id,
                    "is_active": True,
                    "is_superuser": False,
                    "image": None
                }
                instructor = self.create_one(lambda d=instructor_data: d, skip_if_exists=False)
                if instructor:
                    instructors.append(instructor)
            else:
                instructors.append(existing)

        self.db.commit()
        Colors.success(f"{len(instructors)} instructor(s) seeded")
        return instructors

    def seed_students(self, role_id: int, count: int = 200):
        students = []

        # Determinsitc combination lists of Cambodian names
        family_names = [
            "Sok", "Heng", "Pich", "Chan", "Keo", "Seng", "Chea", "Meas", "Ros", "Khorn", 
            "Lim", "Tep", "Yim", "Nguon", "Ouk", "Touch", "Long", "Khun", "Chhim", "Sam", 
            "Phan", "Rith", "Vong", "Ung", "Mao"
        ]
        given_names = [
            "Dararith", "Vutha", "Chenda", "Sophal", "Socheata", "Somally", "Samnang", "Serey", "Rasmey", "Both", 
            "Sovann", "Boren", "Vanna", "Sophanha", "Piseth", "Samedy", "Roth", "Sreyroth", "Kimheng", "Chanraksmey", 
            "Samphors", "Chantha", "Sreypich", "Borin", "Dara"
        ]

        for i in range(count):
            first = family_names[i % len(family_names)]
            last = given_names[(i // len(family_names)) % len(given_names)]
            username = f"{first.lower()}.{last.lower()}{i+1}"
            email = f"{first.lower()}.{last.lower()}{i+1}@example.com"

            existing = self.db.query(User).filter_by(email=email).first()
            if not existing:
                student_data = {
                    "username": username,
                    "email": email,
                    "hashed_password": hash_password(f"{first.lower()}123"),
                    "role_id": role_id,
                    "is_active": True,
                    "is_superuser": False,
                    "image": None
                }
                student = self.create_one(lambda d=student_data: d, skip_if_exists=False)
                if student:
                    students.append(student)
            else:
                students.append(existing)

        self.db.commit()
        Colors.success(f"{len(students)} student(s) seeded")
        return students

    def seed_parents(self, role_id: int, count: int = 50):
        parents = []
        
        # Determinsitc combination lists for parents (using offset to avoid overlaps)
        family_names = [
            "Heng", "Sok", "Pich", "Chea", "Meas", "Ros", "Lim", "Tep", "Yim", "Nguon", 
            "Ouk", "Touch", "Chhim", "Sam", "Phan", "Ung", "Mao", "Keo", "Seng", "Long"
        ]
        given_names = [
            "Sovann", "Phalla", "Sophea", "Rithy", "Veasna", "Vannak", "Sarith", "Phirum", "Socheat", "Chantra", 
            "Kosod", "Vicheka", "Nara", "Darith", "Mony", "Nika", "Seyha", "Vanny", "Bora", "Cheat"
        ]

        for i in range(count):
            first = family_names[i % len(family_names)]
            last = given_names[(i // len(family_names)) % len(given_names)]
            username = f"{first.lower()}.{last.lower()}_parent"
            email = f"{first.lower()}.{last.lower()}_parent@example.com"

            existing = self.db.query(User).filter_by(email=email).first()
            if not existing:
                parent_data = {
                    "username": username,
                    "email": email,
                    "hashed_password": hash_password(f"{first.lower()}123"),
                    "role_id": role_id,
                    "is_active": True,
                    "is_superuser": False,
                    "image": None
                }
                parent = self.create_one(lambda d=parent_data: d, skip_if_exists=False)
                if parent:
                    parents.append(parent)
            else:
                parents.append(existing)

        self.db.commit()
        Colors.success(f"{len(parents)} parent(s) seeded")
        return parents