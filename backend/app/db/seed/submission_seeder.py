from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.submission import Submission
from app.utils.colors import Colors


class SubmissionSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, Submission)

    def seed_submissions(self, student_ids: list[str], assignment_id: int):
        bind = self.db.bind
        if not isinstance(bind, Engine):
            Colors.warning("Database bind is not an Engine, skipping submission seeding")
            return []
        inspector = inspect(bind)
        if "submissions" not in set(inspector.get_table_names()):
            Colors.warning("Table 'submissions' does not exist, skipping submission seeding")
            return []

        created = []
        for student_id in student_ids:
            existing = (
                self.db.query(Submission)
                .filter_by(student_id=student_id, reference_id=assignment_id, submission_type="assignment")
                .first()
            )
            if existing:
                created.append(existing)
                continue

            instance = self.create_one(
                lambda s=student_id, a=assignment_id: {
                    "submission_type": "assignment",
                    "reference_id": a,
                    "student_id": s,
                    "submission_file": None,
                    "submission_text": "Sample submission",
                    "status": "submitted",
                    "score": None,
                    "graded_at": None,
                    "feedback": None,
                },
                skip_if_exists=False,
            )
            if instance:
                created.append(instance)

        self.db.commit()
        Colors.success(f"{len(created)} submission(s) seeded")
        return created
