from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.grade import Grade
from app.models.user import User
from app.schemas.grade import GradeCreate, GradeUpdate, GradeResponse


class GradeService:

    @staticmethod
    def get_grades(db: Session, page: int = 1, limit: int = 10) -> dict:
        total = db.query(func.count(Grade.id)).scalar()
        grades = (
            db.query(Grade)
            .order_by(Grade.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return {
            "data": [GradeResponse.model_validate(g) for g in grades],
            "meta": {"page": page, "total": total, "limit": limit},
        }

    @staticmethod
    def get_student_grades(db: Session, student_id: int) -> list:
        if not db.query(User).filter(User.id == student_id).first():
            raise HTTPException(status_code=404, detail="Student not found")
        grades = (
            db.query(Grade)
            .filter(Grade.student_id == student_id)
            .order_by(Grade.created_at.desc())
            .all()
        )
        return [GradeResponse.model_validate(g) for g in grades]

    @staticmethod
    def upsert_grade(db: Session, grade_in: GradeCreate) -> GradeResponse:
        """Create or update a grade for the same student + assignment/exam pair."""
        if not grade_in.assignment_id and not grade_in.exam_id:
            raise HTTPException(
                status_code=400,
                detail="Either assignment_id or exam_id must be provided",
            )

        query = db.query(Grade).filter(Grade.student_id == grade_in.student_id)
        if grade_in.assignment_id:
            query = query.filter(Grade.assignment_id == grade_in.assignment_id)
        else:
            query = query.filter(Grade.exam_id == grade_in.exam_id)

        existing = query.first()
        if existing:
            existing.score = grade_in.score
            existing.letter_grade = grade_in.letter_grade
            existing.feedback = grade_in.feedback
            db.commit()
            db.refresh(existing)
            return GradeResponse.model_validate(existing)

        obj = Grade(**grade_in.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return GradeResponse.model_validate(obj)

    @staticmethod
    def update_grade(db: Session, grade_id: int, grade_in: GradeUpdate) -> GradeResponse:
        obj = db.query(Grade).filter(Grade.id == grade_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Grade not found")
        for field, value in grade_in.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        db.commit()
        db.refresh(obj)
        return GradeResponse.model_validate(obj)

    @staticmethod
    def delete_grade(db: Session, grade_id: int) -> dict:
        obj = db.query(Grade).filter(Grade.id == grade_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Grade not found")
        db.delete(obj)
        db.commit()
        return {"detail": "Grade deleted successfully"}