from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine
from datetime import date

from app.db.seed.base import BaseSeeder
from app.models.academic_year import AcademicYear
from app.utils.colors import Colors


class AcademicYearSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, AcademicYear)

    def seed_academic_years(self):
        bind = self.db.bind
        if not isinstance(bind, Engine):
            Colors.warning("Database bind is not an Engine, skipping academic year seeding")
            return []
        
        inspector = inspect(bind)
        if "academic_years" not in set(inspector.get_table_names()):
            Colors.warning("Table 'academic_years' does not exist, skipping")
            return []

        data_list = [
            {
                "name": "2025-2026",
                "start_date": date(2025, 9, 1),
                "end_date": date(2026, 8, 31),
                "is_current": True,
                "is_active": True,
            },
            {
                "name": "2026-2027",
                "start_date": date(2026, 9, 1),
                "end_date": date(2027, 8, 31),
                "is_current": False,
                "is_active": True,
            },
        ]

        academic_years = []
        for data in data_list:
            existing = self.db.query(AcademicYear).filter_by(name=data["name"]).first()
            if existing:
                academic_years.append(existing)
                continue

            ay = AcademicYear(**data)
            self.db.add(ay)
            academic_years.append(ay)

        try:
            self.db.commit()
            Colors.success(f"✓ {len(academic_years)} academic year(s) seeded")
        except Exception as e:
            self.db.rollback()
            Colors.error(f"✗ Error seeding academic years: {e}")
            return []

        return academic_years
