from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.course import Enrollment
from app.schemas.enrollment import EnrollmentCreate, EnrollmentUpdate, EnrollmentResponse


class EnrollmentService:

    @staticmethod
    def get_enrollments(db: Session, page: int = 1, limit: int = 10) -> dict:
        total = db.query(func.count(Enrollment.id)).scalar()
        enrollments = (
            db.query(Enrollment)
            .order_by(Enrollment.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return {
            "data": [EnrollmentResponse.model_validate(e) for e in enrollments],
            "meta": {"page": page, "total": total, "limit": limit},
        }

    @staticmethod
    def get_enrollment_by_id(db: Session, enrollment_id: int) -> EnrollmentResponse:
        obj = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        return EnrollmentResponse.model_validate(obj)

    @staticmethod
    def create_enrollment(db: Session, enrollment_in: EnrollmentCreate) -> EnrollmentResponse:
        existing = (
            db.query(Enrollment)
            .filter(
                Enrollment.student_id == enrollment_in.student_id,
                Enrollment.course_id == enrollment_in.course_id,
            )
            .first()
        )
        if existing:
            if existing.is_active:
                raise HTTPException(status_code=400, detail="Student already enrolled")
            existing.is_active = True
            db.commit()
            db.refresh(existing)
            return EnrollmentResponse.model_validate(existing)

        obj = Enrollment(**enrollment_in.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return EnrollmentResponse.model_validate(obj)

    @staticmethod
    def update_enrollment(
        db: Session, enrollment_id: int, enrollment_in: EnrollmentUpdate
    ) -> EnrollmentResponse:
        obj = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        for field, value in enrollment_in.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        db.commit()
        db.refresh(obj)
        return EnrollmentResponse.model_validate(obj)

    @staticmethod
    def delete_enrollment(db: Session, enrollment_id: int) -> dict:
        obj = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        db.delete(obj)
        db.commit()
        return {"detail": "Enrollment deleted successfully"}