from sqlalchemy.orm import Session
from app.db.seed.base import BaseSeeder
from app.models.role import Role


class RoleSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, Role)

    def seed_roles(self):
        roles = [
            {"name": "Admin", "description": "Administrator with full access"},
            {"name": "Teacher", "description": "Teacher with limited access"},
            {"name": "Student", "description": "Student with limited access"},
            {"name": "Parent", "description": "Parent with limited access"},
        ]

        for role_data in roles:
            if not self.exists(name=role_data["name"]):
                self.create_one(lambda: role_data, skip_if_exists=False)
                
        self.log_created("roles")
        
        return {
            "admin": self.db.query(Role).filter_by(name="Admin").first(),
            "teacher": self.db.query(Role).filter_by(name="Teacher").first(),
            "student": self.db.query(Role).filter_by(name="Student").first(),
            "parent": self.db.query(Role).filter_by(name="Parent").first(),
        }