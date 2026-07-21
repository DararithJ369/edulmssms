from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.result import Result
from app.schemas.result import ResultCreate, ResultUpdate, ResultResponse
from app.services.base_service import get_or_404, paginate, create_and_commit, delete_and_commit
from app.services.role_filter import apply_student_role_filter


class ResultService:

    @staticmethod
    def get_results(
        db: Session,
        page: int = 1,
        limit: int = 10,
        search: str = "",
        result_type: str = "",
        current_user = None,
        student_id: Optional[str] = None,
        course_id: Optional[int] = None,
        class_id: Optional[int] = None
    ) -> dict:
        query = db.query(Result)

        if student_id is not None:
            query = query.filter(Result.student_id == student_id)

        if course_id is not None or class_id is not None:
            from app.models.assignment import Assignment
            from app.models.exam import Exam
            from app.models.quiz import Quiz
            from app.models.course import Lesson, Module
            from sqlalchemy import or_

            # Resolve course IDs
            course_ids = []
            if course_id is not None:
                course_ids.append(course_id)
            if class_id is not None:
                from app.services.base_service import get_course_ids_for_class
                course_ids.extend(get_course_ids_for_class(db, class_id))

            # Query assignments, exams, and quizzes linked to these course IDs
            assignment_ids = [r.id for r in db.query(Assignment.id).filter(Assignment.course_id.in_(course_ids)).all()]
            quiz_ids = [r.id for r in db.query(Quiz.id).filter(Quiz.course_id.in_(course_ids)).all()]
            exam_ids = [
                r.id for r in db.query(Exam.id)
                .join(Lesson, Exam.lesson_id == Lesson.id)
                .join(Module, Lesson.module_id == Module.id)
                .filter(Module.course_id.in_(course_ids))
                .all()
            ]

            query = query.filter(
                or_(
                    Result.assignment_id.in_(assignment_ids) if assignment_ids else False,
                    Result.exam_id.in_(exam_ids) if exam_ids else False,
                    Result.quiz_id.in_(quiz_ids) if quiz_ids else False
                )
            )

        query, early = apply_student_role_filter(query, Result.student_id, current_user, page, limit)
        if early is not None:
            return early

        if search:
            from app.models.user_profile import UserProfile
            query = query.join(UserProfile, Result.student_id == UserProfile.user_id).filter(
                (UserProfile.full_name.ilike(f"%{search}%")) |
                (Result.grade.ilike(f"%{search}%"))
            )

        if result_type and result_type != "all":
            if result_type == "exam":
                query = query.filter(Result.exam_id.isnot(None))
            elif result_type == "quiz":
                query = query.filter(Result.quiz_id.isnot(None))
            elif result_type == "assignment":
                query = query.filter(Result.assignment_id.isnot(None))

        return paginate(db, Result, ResultResponse, Result.graded_at.desc(), page, limit, query=query)

    @staticmethod
    def get_result_by_id(db: Session, result_id: int) -> ResultResponse:
        obj = get_or_404(db, Result, result_id, "Result")
        return ResultResponse.model_validate(obj)

    @staticmethod
    def create_result(db: Session, result_in: ResultCreate) -> ResultResponse:
        return create_and_commit(db, Result, result_in, ResultResponse)

    @staticmethod
    def update_result(db: Session, result_id: int, result_in: ResultUpdate) -> ResultResponse:
        obj = db.query(Result).filter(Result.id == result_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Result not found")
        
        # Extract variables using strict primitive fallback handling definitions
        update_data = result_in.model_dump(exclude_unset=True)
        
        # Enforce that updates containing a null score metric are caught before flushing to the DB
        if "score" in update_data and update_data["score"] is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Score value cannot resolve to a null parameter state."
            )

        # Apply parameters cleanly to the fields
        for field, value in update_data.items():
            setattr(obj, field, value)

        # Recalculate evaluation metrics (Percentages, Letter Grades, Pass/Fail states)
        if obj.score is not None and obj.total_marks and obj.total_marks > 0:
            obj.percentage = (float(obj.score) / float(obj.total_marks)) * 100
            
            # Establish passing benchmark standards dynamically from relationships
            pass_threshold = 50.0
            if obj.quiz and getattr(obj.quiz, "pass_mark", None):
                pass_threshold = float(obj.quiz.pass_mark)
            elif obj.assignment and getattr(obj.assignment, "pass_mark", None):
                pass_threshold = float(obj.assignment.pass_mark)
                
            obj.is_passed = obj.percentage >= pass_threshold

            # Apply letter grade normalization boundaries dynamically
            if obj.percentage >= 90:
                obj.grade = "A"
            elif obj.percentage >= 80:
                obj.grade = "B"
            elif obj.percentage >= 70:
                obj.grade = "C"
            elif obj.percentage >= 60:
                obj.grade = "D"
            else:
                obj.grade = "F"

        # ──✅ FIXED: CASCADE SYNC DATA DIRECTLY TO THE SUBMISSIONS RELATION TABLE 
        if obj.assignment_id and obj.student_id:
            try:
                from app.models.submission import Submission
                linked_sub = db.query(Submission).filter(
                    Submission.submission_type == "assignment",
                    Submission.reference_id == obj.assignment_id,
                    Submission.student_id == obj.student_id
                ).first()
                if linked_sub:
                    linked_sub.score = obj.score
                    linked_sub.status = "graded"
                    if "feedback" in update_data:
                        linked_sub.feedback = obj.feedback
            except Exception as ex:
                print(f"Submission sync bypassed: {str(ex)}")

        try:
            db.commit()
            db.refresh(obj)
            return ResultResponse.model_validate(obj)
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database state synchronization failure: {str(e)}"
            )

    @staticmethod
    def delete_result(db: Session, result_id: int) -> dict:
        return delete_and_commit(db, Result, result_id, "Result")
