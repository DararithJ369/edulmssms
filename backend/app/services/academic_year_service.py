from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.academic_year import AcademicYear
from app.models.term import Term
from app.schemas.academic_year import AcademicYearCreate, AcademicYearUpdate, AcademicYearResponse
from app.schemas.term import TermCreate, TermUpdate, TermResponse
from app.services.base_service import get_or_404, paginate, apply_update


class AcademicYearService:

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
    def get_academic_years(db: Session, page: int = 1, limit: int = 10) -> dict:
        return paginate(db, AcademicYear, AcademicYearResponse, AcademicYear.start_date.desc(), page, limit)

    @staticmethod
    def get_academic_year_by_id(db: Session, year_id: int) -> AcademicYearResponse:
        obj = get_or_404(db, AcademicYear, year_id, "Academic year")
        return AcademicYearResponse.model_validate(obj)

    @staticmethod
    def get_current(db: Session) -> AcademicYearResponse:
        obj = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()
        if not obj:
            raise HTTPException(status_code=404, detail="No current academic year set")
        return AcademicYearResponse.model_validate(obj)

    @staticmethod
    def create_academic_year(db: Session, year_in: AcademicYearCreate) -> AcademicYearResponse:
        if db.query(AcademicYear).filter(AcademicYear.name == year_in.name).first():
            raise HTTPException(status_code=400, detail="Academic year name already exists")

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
        obj = get_or_404(db, AcademicYear, year_id, "Academic year")

        if year_in.is_current:
            db.query(AcademicYear).filter(
                AcademicYear.is_current == True, AcademicYear.id != year_id
            ).update({"is_current": False})

        apply_update(obj, year_in)
        db.commit()
        db.refresh(obj)
        return AcademicYearResponse.model_validate(obj)

    @staticmethod
    def delete_academic_year(db: Session, year_id: int) -> dict:
        obj = get_or_404(db, AcademicYear, year_id, "Academic year")
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
        get_or_404(db, AcademicYear, year_id, "Academic year")
        terms = (
            db.query(Term)
            .filter(Term.academic_year_id == year_id)
            .order_by(Term.start_date.asc())
            .all()
        )
        return [TermResponse.model_validate(t) for t in terms]

    @staticmethod
    def create_term(db: Session, year_id: int, term_in: TermCreate) -> TermResponse:
        get_or_404(db, AcademicYear, year_id, "Academic year")

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
        term = get_or_404(db, Term, term_id, "Term")

        if term_in.is_current:
            db.query(Term).filter(
                Term.academic_year_id == term.academic_year_id,
                Term.is_current == True,
                Term.id != term_id,
            ).update({"is_current": False})

        apply_update(term, term_in)
        db.commit()
        db.refresh(term)
        return TermResponse.model_validate(term)

    @staticmethod
    def delete_term(db: Session, term_id: int) -> dict:
        term = get_or_404(db, Term, term_id, "Term")
        if term.enrollments:
            raise HTTPException(
                status_code=400, detail="Cannot delete term with existing enrollments"
            )
        db.delete(term)
        db.commit()
        return {"detail": "Term deleted successfully"}
