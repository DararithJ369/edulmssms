from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.result import Result
from app.utils.colors import Colors


class ResultSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, Result)

    def seed_results(self, student_ids: list[str], assignment_id: int | None = None, graded_by: str | None = None):
        bind = self.db.bind
        if not isinstance(bind, Engine):
            Colors.warning("Database bind is not an Engine, skipping result seeding")
            return []
        inspector = inspect(bind)
        if "results" not in set(inspector.get_table_names()):
            Colors.warning("Table 'results' does not exist, skipping result seeding")
            return []

        created = []
        for student_id in student_ids:
            existing = (
                self.db.query(Result)
                .filter_by(student_id=student_id, assignment_id=assignment_id)
                .first()
            )
            if existing:
                created.append(existing)
                continue

            instance = self.create_one(
                lambda s=student_id, a=assignment_id, g=graded_by: {
                    "student_id": s,
                    "assignment_id": a,
                    "exam_id": None,
                    "graded_by": g,
                    "score": 75,
                    "total_marks": 100,
                    "percentage": 75.0,
                    "grade": "B",
                    "feedback": "Good work",
                    "is_passed": True,
                },
                skip_if_exists=False,
            )
            if instance:
                created.append(instance)

        self.db.commit()
        Colors.success(f"{len(created)} result(s) seeded")
        return created
