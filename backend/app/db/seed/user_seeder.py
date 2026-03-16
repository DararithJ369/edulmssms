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
        Colors.success(
            f"Admin user created with email: {admin.email} and password: admin123"
        )

        return admin


    def seed_teacher(self, role_id: int):
        teacher = self.db.query(User).filter_by(email="teacher@example.com").first()

        if teacher:
            return teacher

        teacher_data = {
            "username": "teacher",
            "email": "teacher@example.com",
            "hashed_password": hash_password("teacher123"),
            "role_id": role_id,
            "is_active": True,
            "is_superuser": False,
            "image": None
        }

        teacher = self.create_one(lambda: teacher_data, skip_if_exists=False)

        Colors.success(
            f"Teacher user created with email: {teacher.email} and password: teacher123"
        )

        return teacher

    def seed_students(self, role_id: int, count: int = 5):
        students = []
        for i in range(1, count + 1):
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