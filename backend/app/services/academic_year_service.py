from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.academic_year import AcademicYear
from app.models.term import Term
from app.schemas.academic_year import AcademicYearCreate, AcademicYearUpdate, AcademicYearResponse
from app.schemas.term import TermCreate, TermUpdate, TermResponse


class AcademicYearService:

    @staticmethod
    def get_academic_years(db: Session, page: int = 1, limit: int = 10) -> dict:
        total = db.query(func.count(AcademicYear.id)).scalar()
        years = (
            db.query(AcademicYear)
            .order_by(AcademicYear.start_date.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return {
            "data": [AcademicYearResponse.model_validate(y) for y in years],
            "meta": {"page": page, "total": total, "limit": limit},
        }

    @staticmethod
    def get_academic_year_by_id(db: Session, year_id: int) -> AcademicYearResponse:
        obj = db.query(AcademicYear).filter(AcademicYear.id == year_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Academic year not found")
        return AcademicYearResponse.model_validate(obj)

    @staticmethod
    def get_current(db: Session) -> AcademicYearResponse:
        obj = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()
        if not obj:
            raise HTTPException(status_code=404, detail="No current academic year set")
        return AcademicYearResponse.model_validate(obj)

    @staticmethod
    def setup_form(db: Session) -> dict:
        return {
            "fields": {
                "name":       {"type": "string", "required": True,  "hint": "e.g. 2024-2025"},
                "start_date": {"type": "date",   "required": True},
                "end_date":   {"type": "date",   "required": True},
                "is_current": {"type": "boolean","required": False},
                "is_active":  {"type": "boolean","required": False},
            }
        }

    @staticmethod
    def create_academic_year(db: Session, year_in: AcademicYearCreate) -> AcademicYearResponse:
        if db.query(AcademicYear).filter(AcademicYear.name == year_in.name).first():
            raise HTTPException(status_code=400, detail="Academic year name already exists")

        # Only one current year allowed at a time
        if year_in.is_current:
            db.query(AcademicYear).filter(AcademicYear.is_current == True).update({"is_current": False})

        obj = AcademicYear(**year_in.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return AcademicYearResponse.model_validate(obj)

    @staticmethod
    def update_academic_year(
        db: Session, year_id: int, year_in: AcademicYearUpdate
    ) -> AcademicYearResponse:
        obj = db.query(AcademicYear).filter(AcademicYear.id == year_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Academic year not found")

        # Setting this as current → unset all others
        if year_in.is_current:
            db.query(AcademicYear).filter(
                AcademicYear.is_current == True, AcademicYear.id != year_id
            ).update({"is_current": False})

        for field, value in year_in.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)

        db.commit()
        db.refresh(obj)
        return AcademicYearResponse.model_validate(obj)

    @staticmethod
    def delete_academic_year(db: Session, year_id: int) -> dict:
        obj = db.query(AcademicYear).filter(AcademicYear.id == year_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Academic year not found")
        if obj.enrollments:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete academic year with existing enrollments",
            )
        db.delete(obj)
        db.commit()
        return {"detail": "Academic year deleted successfully"}

    # ── Terms ─────────────────────────────────────────────────────────────────

    @staticmethod
    def get_terms(db: Session, year_id: int) -> list:
        if not db.query(AcademicYear).filter(AcademicYear.id == year_id).first():
            raise HTTPException(status_code=404, detail="Academic year not found")
        terms = (
            db.query(Term)
            .filter(Term.academic_year_id == year_id)
            .order_by(Term.start_date.asc())
            .all()
        )
        return [TermResponse.model_validate(t) for t in terms]

    @staticmethod
    def create_term(db: Session, year_id: int, term_in: TermCreate) -> TermResponse:
        if not db.query(AcademicYear).filter(AcademicYear.id == year_id).first():
            raise HTTPException(status_code=404, detail="Academic year not found")

        # Only one current term per year
        if term_in.is_current:
            db.query(Term).filter(
                Term.academic_year_id == year_id, Term.is_current == True
            ).update({"is_current": False})

        term = Term(academic_year_id=year_id, **term_in.model_dump(exclude={"academic_year_id"}))
        db.add(term)
        db.commit()
        db.refresh(term)
        return TermResponse.model_validate(term)

    @staticmethod
    def update_term(db: Session, term_id: int, term_in: TermUpdate) -> TermResponse:
        term = db.query(Term).filter(Term.id == term_id).first()
        if not term:
            raise HTTPException(status_code=404, detail="Term not found")

        if term_in.is_current:
            db.query(Term).filter(
                Term.academic_year_id == term.academic_year_id,
                Term.is_current == True,
                Term.id != term_id,
            ).update({"is_current": False})

        for field, value in term_in.model_dump(exclude_unset=True).items():
            setattr(term, field, value)

        db.commit()
        db.refresh(term)
        return TermResponse.model_validate(term)

    @staticmethod
    def delete_term(db: Session, term_id: int) -> dict:
        term = db.query(Term).filter(Term.id == term_id).first()
        if not term:
            raise HTTPException(status_code=404, detail="Term not found")
        if term.enrollments:
            raise HTTPException(
                status_code=400, detail="Cannot delete term with existing enrollments"
            )
        db.delete(term)
        db.commit()
        return {"detail": "Term deleted successfully"}