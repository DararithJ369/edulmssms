from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.submission import Submission
from app.utils.colors import Colors


class SubmissionSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, Submission)

    def seed_submissions(self, student_ids: list[str], assignments: list):
        bind = self.db.bind
        if not isinstance(bind, Engine):
            Colors.warning("Database bind is not an Engine, skipping submission seeding")
            return []
        inspector = inspect(bind)
        if "submissions" not in set(inspector.get_table_names()):
            Colors.warning("Table 'submissions' does not exist, skipping submission seeding")
            return []

        import random
        rng = random.Random(42)

        created = []
        for assignment in assignments:
            assignment_id = assignment.id
            title = assignment.title

            for student_id in student_ids:
                existing = (
                    self.db.query(Submission)
                    .filter_by(student_id=student_id, reference_id=assignment_id, submission_type="assignment")
                    .first()
                )
                if existing:
                    created.append(existing)
                    continue

                # Generate highly realistic comments based on student names and assignments
                if title == "Responsive Portfolio Website Layout":
                    text = f"Hi Teacher! I completed my portfolio layouts. Check out my live link at: github.com/student-dev/portfolio-page. I integrated HSL colors, glassmorphic headers, and customized CSS grids."
                elif title == "Interactive DOM Game Challenge":
                    text = f"Here is my Memory Matching game submission: github.com/student-dev/memory-match. It features custom card assets, CSS animations, and event listener handlers."
                elif title == "FastAPI REST API Server":
                    text = f"Built the REST API Server with FastAPI. Tested GET/POST endpoints thoroughly. Pydantic constraints prevent invalid request parameters: github.com/student-dev/fastapi-todo."
                elif title == "Command-Line Calculator Tool":
                    text = f"Finished the command line script. Includes error trapping for division-by-zero errors. Source code file attached."
                elif title == "Student Grade Book Tracker":
                    text = f"Implemented list and dictionary operations in python. Computes averages and handles composite dictionary objects successfully."
                elif title == "BeautifulSoup News Scraper":
                    text = f"Completed the BeautifulSoup parser. Extracts headlines and article anchors from technical articles and prints them cleanly."
                else:
                    text = f"Please find my homework assignment submission. Solved all exercises."

                # Status: 85% graded (status="submitted" but will be marked as "graded" when results are seeded), 15% pending (status="submitted")
                status = "submitted"
                
                instance = self.create_one(
                    lambda: {
                        "submission_type": "assignment",
                        "reference_id": assignment_id,
                        "student_id": student_id,
                        "submission_file": "https://res.cloudinary.com/demo/image/upload/sample.jpg" if rng.random() < 0.5 else None,
                        "submission_text": text,
                        "status": status,
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

