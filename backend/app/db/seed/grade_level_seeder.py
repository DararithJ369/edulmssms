from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.grade_level import GradeLevel
from app.utils.colors import Colors


class GradeLevelSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, GradeLevel)

    def seed_grade_levels(self):
        bind = self.db.bind
        if not isinstance(bind, Engine):
            Colors.warning("Database bind is not an Engine, skipping grade level seeding")
            return []
        
        inspector = inspect(bind)
        if "grade_levels" not in set(inspector.get_table_names()):
            Colors.warning("Table 'grade_levels' does not exist, skipping")
            return []

        data_list = [
            {
                "name": "Grade 1",
                "code": "G1",
                "description": "Primary Level - Grade 1",
                "order": 1,
                "is_active": True,
            },
            {
                "name": "Grade 2",
                "code": "G2",
                "description": "Primary Level - Grade 2",
                "order": 2,
                "is_active": True,
            },
            {
                "name": "Grade 3",
                "code": "G3",
                "description": "Primary Level - Grade 3",
                "order": 3,
                "is_active": True,
            },
            {
                "name": "Grade 10",
                "code": "G10",
                "description": "Secondary Level - Grade 10",
                "order": 10,
                "is_active": True,
            },
            {
                "name": "Grade 11",
                "code": "G11",
                "description": "Secondary Level - Grade 11",
                "order": 11,
                "is_active": True,
            },
            {
                "name": "Grade 12",
                "code": "G12",
                "description": "Secondary Level - Grade 12",
                "order": 12,
                "is_active": True,
            },
        ]

        grade_levels = []
        for data in data_list:
            existing = self.db.query(GradeLevel).filter_by(name=data["name"]).first()
            if existing:
                grade_levels.append(existing)
                continue

            gl = GradeLevel(**data)
            self.db.add(gl)
            grade_levels.append(gl)

        try:
            self.db.commit()
            Colors.success(f"✓ {len(grade_levels)} grade level(s) seeded")
        except Exception as e:
            self.db.rollback()
            Colors.error(f"✗ Error seeding grade levels: {e}")
            return []

        return grade_levels
