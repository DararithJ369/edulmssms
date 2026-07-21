import random
from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.submission import Submission
from app.models.enrollment import Enrollment
from app.utils.colors import Colors


class SubmissionSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, Submission)

    def seed_submissions(self, student_ids: list[str], assignments: list, quizzes: list, exams: list):
        bind = self.db.bind
        if not isinstance(bind, Engine):
            Colors.warning("Database bind is not an Engine, skipping submission seeding")
            return []
        inspector = inspect(bind)
        if "submissions" not in set(inspector.get_table_names()):
            Colors.warning("Table 'submissions' does not exist, skipping submission seeding")
            return []

        rng = random.Random(42)  # Deterministic seed
        created = []

        # Query active enrollments to link submissions correctly
        enrollments = self.db.query(Enrollment).filter_by(is_active=True).all()

        for enrollment in enrollments:
            student_profile = enrollment.student_profile
            student_user_id = student_profile.profile.user_id
            course_id = enrollment.course_id

            # 1. Seed Assignment Submissions
            course_assignments = [a for a in assignments if a.course_id == course_id]
            for assignment in course_assignments:
                # Check if submission already exists
                existing = (
                    self.db.query(Submission)
                    .filter_by(
                        student_id=student_user_id,
                        reference_id=assignment.id,
                        submission_type="assignment"
                    )
                    .first()
                )
                if existing:
                    created.append(existing)
                    continue

                # Submission distribution: 85% submitted on-time, 10% submitted late, 5% missing (no submission)
                rand_val = rng.random()
                if rand_val >= 0.95:
                    continue  # Missing assignment (no record)

                status = "submitted" if rand_val < 0.85 else "late"
                text = f"Dear instructor, I have completed the assignment work on '{assignment.title}'. I have checked all edge cases and submitted the GitHub repository link: github.com/dev-student/repo-assignment-{assignment.id}"
                
                sub_data = {
                    "submission_type": "assignment",
                    "reference_id": assignment.id,
                    "student_id": student_user_id,
                    "submission_file": "https://res.cloudinary.com/demo/image/upload/sample.jpg",
                    "submission_text": text,
                    "status": status,
                    "score": None,
                    "graded_at": None,
                    "feedback": None
                }

                instance = self.create_one(lambda d=sub_data: d, skip_if_exists=False)
                if instance:
                    created.append(instance)

            # 2. Seed Quiz Submissions (Attempts)
            course_quizzes = [q for q in quizzes if q.course_id == course_id]
            for quiz in course_quizzes:
                existing = (
                    self.db.query(Submission)
                    .filter_by(
                        student_id=student_user_id,
                        reference_id=quiz.id,
                        submission_type="quiz"
                    )
                    .first()
                )
                if existing:
                    created.append(existing)
                    continue

                # Quiz attempt rate: 95% taken, 5% missed
                if rng.random() >= 0.95:
                    continue

                sub_data = {
                    "submission_type": "quiz",
                    "reference_id": quiz.id,
                    "student_id": student_user_id,
                    "submission_file": None,
                    "submission_text": "Completed quiz attempt programmatically via portal interface.",
                    "status": "submitted",
                    "score": None,
                    "graded_at": None,
                    "feedback": None
                }

                instance = self.create_one(lambda d=sub_data: d, skip_if_exists=False)
                if instance:
                    created.append(instance)

            # 3. Seed Exam Submissions
            # Note: Exams are linked via lesson_id. We fetch exams belonging to lessons of this course.
            course_exams = [e for e in exams if e.lesson and e.lesson.module and e.lesson.module.course_id == course_id]
            for exam in course_exams:
                existing = (
                    self.db.query(Submission)
                    .filter_by(
                        student_id=student_user_id,
                        reference_id=exam.id,
                        submission_type="exam"
                    )
                    .first()
                )
                if existing:
                    created.append(existing)
                    continue

                # Exam attendance rate: 98% taken, 2% missed
                if rng.random() >= 0.98:
                    continue

                sub_data = {
                    "submission_type": "exam",
                    "reference_id": exam.id,
                    "student_id": student_user_id,
                    "submission_file": None,
                    "submission_text": f"Completed exam at {exam.venue}. Submitted physical and digital answer booklets.",
                    "status": "submitted",
                    "score": None,
                    "graded_at": None,
                    "feedback": None
                }

                instance = self.create_one(lambda d=sub_data: d, skip_if_exists=False)
                if instance:
                    created.append(instance)

        self.db.commit()
        Colors.success(f"{len(created)} submission record(s) seeded")
        return created
