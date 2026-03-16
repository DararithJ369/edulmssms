from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.result import Result
from app.schemas.result import ResultCreate, ResultUpdate, ResultResponse


class ResultService:

    @staticmethod
    def get_results(db: Session, page: int = 1, limit: int = 10) -> dict:
        total = db.query(func.count(Result.id)).scalar()
        results = (
            db.query(Result)
            .order_by(Result.created_at.desc())
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