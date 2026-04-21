from sqlalchemy.orm import Session
from app.db.seed.base import BaseSeeder
from app.models.role import Role


class RoleSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, Role)

    def seed_roles(self):
        roles = [
            {"name": "admin", "description": "Administrator with full access"},
            {"name": "instructor", "description": "Instructor with limited access"},
            {"name": "student", "description": "Student with limited access"},
            {"name": "parent", "description": "Parent with limited access"},
        ]

        for role_data in roles:
            if not self.exists(name=role_data["name"]):
                self.create_one(lambda: role_data, skip_if_exists=False)
                
        self.log_created("roles")
        
        return {
            "admin": self.db.query(Role).filter_by(name="admin").first(),
            "instructor": self.db.query(Role).filter_by(name="instructor").first(),
            "student": self.db.query(Role).filter_by(name="student").first(),
            "parent": self.db.query(Role).filter_by(name="parent").first(),
        }