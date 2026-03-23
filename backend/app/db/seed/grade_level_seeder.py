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
                "name": "Year 1",
                "code": "Y1",
                "description": "First Year - Undergraduate",
                "order": 1,
                "is_active": True,
            },
            {
                "name": "Year 2",
                "code": "Y2",
                "description": "Second Year - Undergraduate",
                "order": 2,
                "is_active": True,
            },
            {
                "name": "Year 3",
                "code": "Y3",
                "description": "Third Year - Undergraduate",
                "order": 3,
                "is_active": True,
            },
            {
                "name": "Year 4",
                "code": "Y4",
                "description": "Fourth Year - Undergraduate",
                "order": 4,
                "is_active": True,
            },
            {
                "name": "Master Year 1",
                "code": "MY1",
                "description": "First Year - Master's Program",
                "order": 5,
                "is_active": True,
            },
            {
                "name": "Master Year 2",
                "code": "MY2",
                "description": "Second Year - Master's Program",
                "order": 6,
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
