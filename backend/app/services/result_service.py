from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.result import Result
from app.models.user import User
from app.schemas.result import ResultCreate, ResultUpdate, ResultResponse


class ResultService:

    @staticmethod
    def get_results(db: Session, page: int = 1, limit: int = 10, search: str = "", result_type: str = "") -> dict:
        query = db.query(Result)
        
        if search:
            query = query.join(User, Result.student_id == User.id).filter(
                (User.first_name.ilike(f"%{search}%")) |
                (User.last_name.ilike(f"%{search}%")) |
                (Result.grade.ilike(f"%{search}%"))
            )
        
        if result_type and result_type != "all":
            if result_type == "exam":
                query = query.filter(Result.exam_id.isnot(None))
            elif result_type == "quiz":
                query = query.filter(Result.quiz_id.isnot(None))
            elif result_type == "assignment":
                query = query.filter(Result.assignment_id.isnot(None))
        
        total = query.with_entities(func.count(Result.id)).scalar()
        results = (
            query.order_by(Result.graded_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return {
            "data": [ResultResponse.model_validate(r) for r in results],
            "meta": {"page": page, "total": total, "limit": limit},
        }

    @staticmethod
    def get_result_by_id(db: Session, result_id: int) -> ResultResponse:
        obj = db.query(Result).filter(Result.id == result_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Result not found")
        return ResultResponse.model_validate(obj)

    @staticmethod
    def create_result(db: Session, result_in: ResultCreate) -> ResultResponse:
        obj = Result(**result_in.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return ResultResponse.model_validate(obj)

    @staticmethod
    def update_result(db: Session, result_id: int, result_in: ResultUpdate) -> ResultResponse:
        obj = db.query(Result).filter(Result.id == result_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Result not found")
        for field, value in result_in.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        db.commit()
        db.refresh(obj)
        return ResultResponse.model_validate(obj)

    @staticmethod
    def delete_result(db: Session, result_id: int) -> dict:
        obj = db.query(Result).filter(Result.id == result_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Result not found")
        db.delete(obj)
        db.commit()
        return {"detail": "Result deleted successfully"}