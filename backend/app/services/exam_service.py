from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.exam import Exam
from app.models.result import Result
from app.schemas.exam import ExamCreate, ExamUpdate, ExamResponse, ExamSubmitPayload
from app.schemas.result import ResultResponse


class ExamService:

    @staticmethod
    def get_exams(db: Session, page: int = 1, limit: int = 10) -> dict:
        total = db.query(func.count(Exam.id)).scalar()
        exams = (
            db.query(Exam)
            .order_by(Exam.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return {
            "data": [ExamResponse.model_validate(e) for e in exams],
            "meta": {"page": page, "total": total, "limit": limit},
        }

    @staticmethod
    def get_exam_by_id(db: Session, exam_id: int) -> ExamResponse:
        obj = db.query(Exam).filter(Exam.id == exam_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Exam not found")
        return ExamResponse.model_validate(obj)

    @staticmethod
    def create_exam(db: Session, exam_in: ExamCreate) -> ExamResponse:
        obj = Exam(**exam_in.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return ExamResponse.model_validate(obj)

    @staticmethod
    def update_exam(db: Session, exam_id: int, exam_in: ExamUpdate) -> ExamResponse:
        obj = db.query(Exam).filter(Exam.id == exam_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Exam not found")
        for field, value in exam_in.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        db.commit()
        db.refresh(obj)
        return ExamResponse.model_validate(obj)

    @staticmethod
    def delete_exam(db: Session, exam_id: int) -> dict:
        obj = db.query(Exam).filter(Exam.id == exam_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Exam not found")
        db.delete(obj)
        db.commit()
        return {"detail": "Exam deleted successfully"}

    # ── Submissions & results ─────────────────────────────────────────────────

    @staticmethod
    def submit_exam(
        db: Session, exam_id: int, student_id: int, payload: ExamSubmitPayload
    ) -> ResultResponse:
        if not db.query(Exam).filter(Exam.id == exam_id).first():
            raise HTTPException(status_code=404, detail="Exam not found")

        if db.query(Result).filter(Result.exam_id == exam_id, Result.student_id == student_id).first():
            raise HTTPException(status_code=400, detail="Exam already submitted")

        # Score is None until manually graded by teacher
        result = Result(
            exam_id=exam_id,
            student_id=student_id,
            score=None,
            notes=getattr(payload, "notes", None),
        )
        db.add(result)
        db.commit()
        db.refresh(result)
        return ResultResponse.model_validate(result)

    @staticmethod
    def get_exam_results(db: Session, exam_id: int) -> list:
        if not db.query(Exam).filter(Exam.id == exam_id).first():
            raise HTTPException(status_code=404, detail="Exam not found")
        results = db.query(Result).filter(Result.exam_id == exam_id).all()
        return [ResultResponse.model_validate(r) for r in results]

    @staticmethod
    def grade_result(
        db: Session, result_id: int, score: float, notes: str = ""
    ) -> ResultResponse:
        result = db.query(Result).filter(Result.id == result_id).first()
        if not result:
            raise HTTPException(status_code=404, detail="Result not found")
        result.score = score
        result.notes = notes
        db.commit()
        db.refresh(result)
        return ResultResponse.model_validate(result)