import importlib
from sqlalchemy import inspect
from sqlalchemy.orm import Session
from app.db.seed.base import BaseSeeder
from app.utils.colors import Colors

# 'class' is a reserved Python keyword — import the model via importlib
_class_module = importlib.import_module("app.models.class_")
ClassModel = getattr(_class_module, "Class")


class ClassSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, ClassModel)

    def seed_class(self, name: str, supervisor_id: str = None, grade_id: int = None, academic_year: str = "2025-26"):
        inspector = inspect(self.db.bind)
        tables = set(inspector.get_table_names())

        if "classes" not in tables:
            Colors.warning("Table 'classes' does not exist, skipping class seeding")
            return None

        if "grades" not in tables:
            Colors.warning("Table 'grades' does not exist, skipping class seeding")
            return None

        if self.exists(name=name, academic_year=academic_year):
            Colors.success(f"Class '{name}' already exists, skipping")
            return self.db.query(ClassModel).filter_by(name=name, academic_year=academic_year).first()

        if not supervisor_id:
            from app.models.user import User
            admin = self.db.query(User).filter_by(username="admin").first()
            if not admin:
                Colors.success("No supervisor found, skipping class seeding")
                return None
            supervisor_id = admin.id

        if not grade_id:
            from app.models.grade import Grade
            grade = self.db.query(Grade).first()
            if not grade:
                Colors.success("No grade found, skipping class seeding")
                return None
            grade_id = grade.id

        class_data = {
            "name": name,
            "grade_id": grade_id,
            "supervisor_id": supervisor_id,
            "academic_year": academic_year,
            "section": "A",
            "capacity": 30,
            "is_active": True,
        }

        instance = self.create_one(lambda: class_data, skip_if_exists=False)
        self.db.commit()
        Colors.success(f"Class '{name}' seeded")
        return instance
