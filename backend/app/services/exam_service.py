from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.exam import Exam
from app.models.result import Result
from app.schemas.exam import ExamCreate, ExamUpdate, ExamResponse, ExamSubmitPayload
from app.schemas.result import ResultResponse
from app.services.base_service import get_or_404, paginate, apply_update, create_and_commit, delete_and_commit


class ExamService:

    @staticmethod
    def get_exams(db: Session, page: int = 1, limit: int = 10) -> dict:
        return paginate(db, Exam, ExamResponse, Exam.created_at.desc(), page, limit)

    @staticmethod
    def get_exam_by_id(db: Session, exam_id: int) -> ExamResponse:
        obj = get_or_404(db, Exam, exam_id, "Exam")
        return ExamResponse.model_validate(obj)

    @staticmethod
    def create_exam(db: Session, exam_in: ExamCreate) -> ExamResponse:
        return create_and_commit(db, Exam, exam_in, ExamResponse)

    @staticmethod
    def update_exam(db: Session, exam_id: int, exam_in: ExamUpdate) -> ExamResponse:
        obj = get_or_404(db, Exam, exam_id, "Exam")
        apply_update(obj, exam_in)
        db.commit()
        db.refresh(obj)
        return ExamResponse.model_validate(obj)

    @staticmethod
    def delete_exam(db: Session, exam_id: int) -> dict:
        return delete_and_commit(db, Exam, exam_id, "Exam")

    # ── Submissions & results ─────────────────────────────────────────────────

    @staticmethod
    def submit_exam(
        db: Session, exam_id: int, student_id: int, payload: ExamSubmitPayload
    ) -> ResultResponse:
        get_or_404(db, Exam, exam_id, "Exam")

        if db.query(Result).filter(Result.exam_id == exam_id, Result.student_id == student_id).first():
            raise HTTPException(status_code=400, detail="Exam already submitted")

        result = Result(
            exam_id=exam_id,
            student_id=student_id,
            score=None,
            notes=getattr(payload, "notes", None),
        )
        db.add(result)

        try:
            from app.services.streak_service import StreakService
            StreakService.record_activity(db, str(student_id))
        except Exception as e:
            print(f"Failed to record streak activity on exam submit: {e}")

        db.commit()
        db.refresh(result)
        return ResultResponse.model_validate(result)

    @staticmethod
    def get_exam_results(db: Session, exam_id: int) -> list:
        get_or_404(db, Exam, exam_id, "Exam")
        results = db.query(Result).filter(Result.exam_id == exam_id).all()
        return [ResultResponse.model_validate(r) for r in results]

    @staticmethod
    def grade_result(
        db: Session, result_id: int, score: float, notes: str = ""
    ) -> ResultResponse:
        result = get_or_404(db, Result, result_id, "Result")
        result.score = score
        result.notes = notes
        db.commit()
        db.refresh(result)
        return ResultResponse.model_validate(result)
