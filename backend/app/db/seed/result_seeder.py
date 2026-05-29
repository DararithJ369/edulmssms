from sqlalchemy import inspect, func
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.result import Result
from app.utils.colors import Colors


class ResultSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, Result)

    def seed_results(self, student_ids: list[str], assignments: list, instructor_ids: list[str]):
        bind = self.db.bind
        if not isinstance(bind, Engine):
            Colors.warning("Database bind is not an Engine, skipping result seeding")
            return []
        inspector = inspect(bind)
        if "results" not in set(inspector.get_table_names()):
            Colors.warning("Table 'results' does not exist, skipping result seeding")
            return []

        import random
        from app.models.user_profile import UserProfile
        from app.models.submission import Submission
        
        # Deterministic generator for consistent grades output
        rng = random.Random(42)

        def get_instructor(index: int) -> str:
            if not instructor_ids:
                return None
            if index < len(instructor_ids):
                return instructor_ids[index]
            return instructor_ids[0]

        created = []
        for assignment in assignments:
            assignment_id = assignment.id
            title = assignment.title
            
            # Map grader to the assigned teacher
            graded_by = get_instructor(0) if assignment.course_id == 1 else get_instructor(1)

            for student_id in student_ids:
                existing = (
                    self.db.query(Result)
                    .filter_by(student_id=student_id, assignment_id=assignment_id)
                    .first()
                )
                if existing:
                    created.append(existing)
                    continue

                # Query student name to build personalized feedback
                profile = self.db.query(UserProfile).filter_by(user_id=student_id).first()
                full_name = profile.full_name if profile else "Student"
                first_name = full_name.split()[0]

                # Grade score between 70 and 98
                score = rng.randint(70, 98)
                total_marks = 100
                percentage = float(score)

                if score >= 90:
                    grade = "A"
                    feedback_options = [
                        f"Incredible work, {first_name}! Your layouts are highly refined and the responsive media queries align flawlessly.",
                        f"Outstanding implementation, {first_name}. Clean and well-commented code structure. The layout logic is superb!",
                        f"Superb optimization, {first_name}! Excellent error validation coverage. Easily the top score in the section."
                    ]
                elif score >= 80:
                    grade = "B"
                    feedback_options = [
                        f"Very good effort, {first_name}. Your solution maps elements cleanly. Next time, double check flex container rules on extra-small viewports.",
                        f"Great code structure, {first_name}. Your array handlers are clean and readable. Good job!",
                        f"Excellent logic, {first_name}. Traps common input errors nicely. Try to abstract your functions further in the future."
                    ]
                else:
                    grade = "C"
                    feedback_options = [
                        f"Good foundational build, {first_name}. The DOM selectors query nodes successfully. Watch out for naming conventions on variables.",
                        f"Satisfactory implementation, {first_name}. The scraping script extracts titles fine, but fails occasionally on slow server timeouts.",
                        f"Decent approach, {first_name}. Works as expected but can be optimized to reduce memory allocations."
                    ]

                feedback = rng.choice(feedback_options)

                instance = self.create_one(
                    lambda: {
                        "student_id": student_id,
                        "assignment_id": assignment_id,
                        "exam_id": None,
                        "graded_by": graded_by,
                        "score": score,
                        "total_marks": total_marks,
                        "percentage": percentage,
                        "grade": grade,
                        "feedback": feedback,
                        "is_passed": score >= 50,
                    },
                    skip_if_exists=False,
                )
                if instance:
                    # Also update corresponding submission status to graded
                    submission = (
                        self.db.query(Submission)
                        .filter_by(student_id=student_id, reference_id=assignment_id, submission_type="assignment")
                        .first()
                    )
                    if submission:
                        submission.status = "graded"
                        submission.score = score
                        submission.feedback = feedback
                        submission.graded_at = func.now()
                    
                    created.append(instance)

        self.db.commit()
        Colors.success(f"{len(created)} result(s) seeded")
        return created

