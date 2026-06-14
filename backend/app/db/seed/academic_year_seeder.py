from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine
from datetime import date

from app.db.seed.base import BaseSeeder
from app.models.academic_year import AcademicYear
from app.models.term import Term
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
        tables = set(inspector.get_table_names())
        if "academic_years" not in tables:
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
                # Ensure terms exist for this existing year
                self._seed_terms_for_year(existing)
                continue

            ay = AcademicYear(**data)
            self.db.add(ay)
            self.db.flush()
            academic_years.append(ay)
            self._seed_terms_for_year(ay)

        try:
            self.db.commit()
            Colors.success(f"✓ {len(academic_years)} academic year(s) and associated terms seeded")
        except Exception as e:
            self.db.rollback()
            Colors.error(f"✗ Error seeding academic years/terms: {e}")
            return []

        return academic_years

    def _seed_terms_for_year(self, ay: AcademicYear):
        """Seed Semester I and Semester II for the academic year"""
        term_data = [
            {
                "name": "Semester I",
                "start_date": date(ay.start_date.year, 9, 1),
                "end_date": date(ay.start_date.year + 1, 1, 31),
                "is_current": ay.is_current,  # Current term if year is current
                "is_active": True,
                "academic_year_id": ay.id
            },
            {
                "name": "Semester II",
                "start_date": date(ay.start_date.year + 1, 2, 1),
                "end_date": date(ay.start_date.year + 1, 8, 31),
                "is_current": False,
                "is_active": True,
                "academic_year_id": ay.id
            }
        ]

        for td in term_data:
            existing_term = self.db.query(Term).filter_by(name=td["name"], academic_year_id=ay.id).first()
            if not existing_term:
                t = Term(**td)
                self.db.add(t)
        self.db.flush()
