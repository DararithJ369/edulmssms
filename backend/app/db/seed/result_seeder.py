import random
from sqlalchemy import inspect, func
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.result import Result
from app.models.submission import Submission
from app.models.assignment import Assignment
from app.models.quiz import Quiz
from app.models.exam import Exam
from app.models.user_profile import UserProfile
from app.utils.colors import Colors


class ResultSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, Result)

    def seed_results(self, student_ids: list[str], instructor_ids: list[str]):
        bind = self.db.bind
        if not isinstance(bind, Engine):
            Colors.warning("Database bind is not an Engine, skipping result seeding")
            return []
        inspector = inspect(bind)
        if "results" not in set(inspector.get_table_names()):
            Colors.warning("Table 'results' does not exist, skipping result seeding")
            return []

        rng = random.Random(42)  # Deterministic seed

        def get_fallback_instructor(index: int) -> str:
            if not instructor_ids:
                return None
            return instructor_ids[index % len(instructor_ids)]

        # Grading pool to satisfy the bell curve distribution:
        # A: 15%, B: 30%, C: 35%, D: 15%, F: 5%
        grade_pool = (["A"] * 15) + (["B"] * 30) + (["C"] * 35) + (["D"] * 15) + (["F"] * 5)

        created = []
        
        # Query all student submissions to grade them
        submissions = self.db.query(Submission).all()

        # Eager load maps to avoid N+1 queries in the loop
        assignments_map = {a.id: a for a in self.db.query(Assignment).all()}
        quizzes_map = {q.id: q for q in self.db.query(Quiz).all()}
        exams_map = {e.id: e for e in self.db.query(Exam).all()}
        profiles_map = {p.user_id: p for p in self.db.query(UserProfile).all()}
        
        # Eager load existing results to avoid querying in loop
        # Format key as: (student_id, type, ref_id)
        existing_results = set()
        for r in self.db.query(Result).all():
            if r.assignment_id:
                existing_results.add((r.student_id, "assignment", r.assignment_id))
            elif r.quiz_id:
                existing_results.add((r.student_id, "quiz", r.quiz_id))
            elif r.exam_id:
                existing_results.add((r.student_id, "exam", r.exam_id))

        for submission in submissions:
            sub_type = submission.submission_type
            ref_id = submission.reference_id
            student_id = submission.student_id

            # Determine key fields and check for existing Result
            assignment_id = None
            quiz_id = None
            exam_id = None
            graded_by = None
            total_marks = 100

            # Check in-memory existing set
            if (student_id, sub_type, ref_id) in existing_results:
                continue

            if sub_type == "assignment":
                assignment_id = ref_id
                assignment = assignments_map.get(ref_id)
                if assignment:
                    graded_by = assignment.teacher_id
            elif sub_type == "quiz":
                quiz_id = ref_id
                quiz = quizzes_map.get(ref_id)
                if quiz:
                    graded_by = quiz.instructor_id
            elif sub_type == "exam":
                exam_id = ref_id
                exam = exams_map.get(ref_id)
                if exam:
                    graded_by = exam.created_by
                    total_marks = exam.total_marks or 100

            if not graded_by:
                graded_by = get_fallback_instructor(0)

            # Look up student profile details in memory map
            profile = profiles_map.get(student_id)
            full_name = profile.full_name if profile else "Student"
            first_name = full_name.split()[0] if len(full_name.split()) > 0 else "Student"

            # Generate score based on the bell curve distribution
            assigned_grade = rng.choice(grade_pool)
            if assigned_grade == "A":
                score = rng.randint(90, 100)
                feedback_options = [
                    f"Excellent implementation, {first_name}! Code is clean, modular, and shows deep understanding.",
                    f"Outstanding work, {first_name}. Perfect design execution, with clear annotations.",
                    f"Superb performance, {first_name}! You covered all requirements and exceeded benchmarks."
                ]
            elif assigned_grade == "B":
                score = rng.randint(80, 89)
                feedback_options = [
                    f"Very good effort, {first_name}. Clean logic. Look out for marginal optimizations.",
                    f"Great result, {first_name}. Well structured logic, but watch out for edge cases.",
                    f"Solid submission, {first_name}. Next time, add comments to document complex functions."
                ]
            elif assigned_grade == "C":
                score = rng.randint(70, 79)
                feedback_options = [
                    f"Good foundational build, {first_name}. The core requirements are fully met.",
                    f"Decent solution, {first_name}. Try to abstract your functions to reduce redundancy.",
                    f"Satisfactory attempt, {first_name}. Make sure to test your queries under scale."
                ]
            elif assigned_grade == "D":
                score = rng.randint(60, 69)
                feedback_options = [
                    f"Passed, {first_name}. However, some parts are incomplete. Re-read instructions carefully.",
                    f"Acceptable attempt, {first_name}, but needs improvement in structure and optimization.",
                    "Just met the passing threshold. Seek tutor support if you have doubts."
                ]
            else:
                score = rng.randint(30, 59)
                feedback_options = [
                    f"Below passing score, {first_name}. Please re-submit or schedule a review with the instructor.",
                    "Incomplete submission. Core requirements were missed or did not compile.",
                    "Needs significant revision. Please consult module guidelines and retry."
                ]

            percentage = float(score) / float(total_marks) * 100.0
            feedback = rng.choice(feedback_options)

            res_data = {
                "student_id": student_id,
                "assignment_id": assignment_id,
                "quiz_id": quiz_id,
                "exam_id": exam_id,
                "graded_by": graded_by,
                "score": score,
                "total_marks": total_marks,
                "percentage": percentage,
                "grade": assigned_grade,
                "feedback": feedback,
                "is_passed": score >= (total_marks * 0.5)
            }

            instance = Result(**res_data)
            self.db.add(instance)
            
            # Update corresponding submission record status to graded
            submission.status = "graded"
            submission.score = float(score)
            submission.feedback = feedback
            submission.graded_at = func.now()
            
            created.append(instance)

        self.db.commit()
        Colors.success(f"{len(created)} result(s) successfully seeded and corresponding submissions graded")
        return created
