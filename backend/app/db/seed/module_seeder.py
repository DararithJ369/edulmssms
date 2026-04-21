from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.course import Module
from app.utils.colors import Colors


class ModuleSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, Module)

    def seed_modules(self, course_id: int | None = None) -> list[Module]:
        """Seed modules for courses"""
        if not course_id:
            return []

        bind = self.db.bind
        if not isinstance(bind, Engine):
            Colors.warning("Database bind is not an Engine, skipping module seeding")
            return []
        inspector = inspect(bind)
        if "modules" not in set(inspector.get_table_names()):
            Colors.warning("Modules table does not exist, skipping")
            return []

        data_list = [
            {
                "title": "Module 1: Fundamentals",
                "description": "Basic concepts and introduction",
                "course_id": course_id,
                "order": 1,
            },
            {
                "title": "Module 2: Advanced Topics",
                "description": "Intermediate and advanced concepts",
                "course_id": course_id,
                "order": 2,
            },
        ]

        modules = []
        for data in data_list:
            # Check if module already exists
            existing = self.db.query(Module).filter_by(title=data["title"], course_id=course_id).first()
            if existing:
                modules.append(existing)
                continue

            module = Module(**data)
            self.db.add(module)
            modules.append(module)

        try:
            self.db.commit()
            Colors.success(f"✓ {len(modules)} module(s) seeded")
        except Exception as e:
            self.db.rollback()
            Colors.error(f"✗ Error seeding modules: {e}")
            return []

        return modules

