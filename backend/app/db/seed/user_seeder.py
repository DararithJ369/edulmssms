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
                f"Admin user created with email: {admin.email} and password: admin123"  # type: ignore
            )

        return admin


    def seed_instructor(self, role_id: int):
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
                f"Instructor user created with email: {instructor.email} and password: instructor123"  # type: ignore
            )

        return instructor

    def seed_students(self, role_id: int, count: int = 10):
        students = []
        student_names = [
            "Emma Johnson", "Liam Smith", "Olivia Williams", "Noah Brown", "Ava Jones",
            "Ethan Garcia", "Sophia Miller", "Mason Davis", "Isabella Rodriguez", "Logan Martinez"
        ]
        
        for i in range(1, min(count + 1, len(student_names) + 1)):
            email = f"student{i}@example.com"
            if not self.exists(email=email):
                student_data = {
                    "username": f"student{i}",
                    "email": email,
                    "hashed_password": hash_password(f"student{i}123"),
                    "role_id": role_id,
                    "is_active": True,
                    "is_superuser": False,
                    "image": None
                }
                student = self.create_one(lambda d=student_data: d, skip_if_exists=False)
                if student:
                    students.append(student)
            else:
                from app.models.user import User
                existing = self.db.query(User).filter_by(email=email).first()
                if existing:
                    students.append(existing)
        self.db.commit()
        Colors.success(f"{len(students)} student(s) seeded")
        return students

    def seed_instructors(self, role_id: int, count: int = 5):
        instructors = []
        instructor_names = [
            "Dr. Sarah Chen", "Prof. Michael Johnson", "Dr. James Wilson", 
            "Prof. Lisa Anderson", "Dr. Robert Martinez"
        ]
        
        for i in range(1, min(count + 1, len(instructor_names) + 1)):
            email = f"instructor{i}@university.edu"
            if not self.exists(email=email):
                instructor_data = {
                    "username": f"instructor{i}",
                    "email": email,
                    "hashed_password": hash_password(f"instructor{i}123"),
                    "role_id": role_id,
                    "is_active": True,
                    "is_superuser": False,
                    "image": None
                }
                instructor = self.create_one(lambda d=instructor_data: d, skip_if_exists=False)
                if instructor:
                    instructors.append(instructor)
            else:
                from app.models.user import User
                existing = self.db.query(User).filter_by(email=email).first()
                if existing:
                    instructors.append(existing)
        self.db.commit()
        Colors.success(f"{len(instructors)} instructor(s) seeded")
        return instructors

    def seed_parents(self, role_id: int, count: int = 5):
        parents = []
        parent_names = [
            "John Johnson", "Mary Smith", "David Williams", 
            "Jennifer Brown", "Robert Jones"
        ]
        
        for i in range(1, min(count + 1, len(parent_names) + 1)):
            email = f"parent{i}@example.com"
            if not self.exists(email=email):
                parent_data = {
                    "username": f"parent{i}",
                    "email": email,
                    "hashed_password": hash_password(f"parent{i}123"),
                    "role_id": role_id,
                    "is_active": True,
                    "is_superuser": False,
                    "image": None
                }
                parent = self.create_one(lambda d=parent_data: d, skip_if_exists=False)
                if parent:
                    parents.append(parent)
            else:
                from app.models.user import User
                existing = self.db.query(User).filter_by(email=email).first()
                if existing:
                    parents.append(existing)
        self.db.commit()
        Colors.success(f"{len(parents)} parent(s) seeded")
        return parents