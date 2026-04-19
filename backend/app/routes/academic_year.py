from typing import Optional
from fastapi import APIRouter, Depends, Form
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.academic_year_service import AcademicYearService
from app.schemas.academic_year import AcademicYearCreate, AcademicYearUpdate, AcademicYearResponse
from app.schemas.term import TermCreate, TermUpdate, TermResponse
from datetime import date

academic_year_router = APIRouter(prefix="/academic-years", tags=["Academic Years"])


# ── Static paths — MUST be before /{year_id} ─────────────────────────────────

@academic_year_router.get("/setup-form", dependencies=[Depends(PermissionGuard.admin_only)])
def setup_form(db: Session = Depends(get_db)):
    return AcademicYearService.setup_form(db)


@academic_year_router.get("/current", response_model=AcademicYearResponse)
def get_current_year(db: Session = Depends(get_db)):
    return AcademicYearService.get_current(db)


# ── Term sub-resource (literal "terms" segment — must precede /{year_id}) ────

@academic_year_router.put(
    "/term/{term_id}",
    response_model=TermResponse,
    dependencies=[Depends(PermissionGuard.admin_only)],
)
def update_term(
    term_id:    int,
    name:       Optional[str]  = Form(None),
    start_date: Optional[date] = Form(None),
    end_date:   Optional[date] = Form(None),
    is_current: Optional[bool] = Form(None),
    is_active:  Optional[bool] = Form(None),
    db: Session = Depends(get_db),
):
    return AcademicYearService.update_term(
        db,
        term_id,
        TermUpdate(
            name=name,
            start_date=start_date,
            end_date=end_date,
            is_current=is_current,
            is_active=is_active,
        ),
    )
    
    
@academic_year_router.delete(
    "/term/{term_id}",
    dependencies=[Depends(PermissionGuard.admin_only)]
)
def delete_term(term_id: int, db: Session = Depends(get_db)):
    return AcademicYearService.delete_term(db, term_id)


# ── Collection ────────────────────────────────────────────────────────────────


@academic_year_router.get("", dependencies=[Depends(PermissionGuard.admin_only)])
def get_all_academic_years(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    return AcademicYearService.get_academic_years(db, page, limit)


@academic_year_router.post("", response_model=AcademicYearResponse, dependencies=[Depends(PermissionGuard.admin_only)])
def create_academic_year(
    name:       str  = Form(...),
    start_date: date = Form(...),
    end_date:   date = Form(...),
    is_current: bool = Form(False),
    is_active:  bool = Form(True),
    db: Session = Depends(get_db),
):
    return AcademicYearService.create_academic_year(
        db,
        AcademicYearCreate(
            name=name,
            start_date=start_date,
            end_date=end_date,
            is_current=is_current,
            is_active=is_active,
        ),
    )


# ── Dynamic /{year_id} — MUST be last ────────────────────────────────────────

@academic_year_router.get("/{year_id}", response_model=AcademicYearResponse)
def get_academic_year(year_id: int, db: Session = Depends(get_db)):
    return AcademicYearService.get_academic_year_by_id(db, year_id)


@academic_year_router.put("/{year_id}", response_model=AcademicYearResponse, dependencies=[Depends(PermissionGuard.admin_only)])
def update_academic_year(
    year_id:    int,
    name:       Optional[str]  = Form(None),
    start_date: Optional[date] = Form(None),
    end_date:   Optional[date] = Form(None),
    is_current: Optional[bool] = Form(None),
    is_active:  Optional[bool] = Form(None),
    db: Session = Depends(get_db),
):
    return AcademicYearService.update_academic_year(
        db,
        year_id,
        AcademicYearUpdate(
            name=name,
            start_date=start_date,
            end_date=end_date,
            is_current=is_current,
            is_active=is_active,
        ),
    )


@academic_year_router.delete("/{year_id}", dependencies=[Depends(PermissionGuard.admin_only)])
def delete_academic_year(year_id: int, db: Session = Depends(get_db)):
    return AcademicYearService.delete_academic_year(db, year_id)


# ── Terms (sub-resource) ──────────────────────────────────────────────────────

@academic_year_router.get("/{year_id}/terms")
def get_terms(year_id: int, db: Session = Depends(get_db)):
    return AcademicYearService.get_terms(db, year_id)


@academic_year_router.post("/{year_id}/terms", response_model=TermResponse, dependencies=[Depends(PermissionGuard.admin_only)])
def create_term(
    year_id:    int,
    name:       str  = Form(...),
    start_date: date = Form(...),
    end_date:   date = Form(...),
    is_current: bool = Form(False),
    is_active:  bool = Form(True),
    db: Session = Depends(get_db),
):
    return AcademicYearService.create_term(
        db,
        year_id,
        TermCreate(
            academic_year_id=year_id,
            name=name,
            start_date=start_date,
            end_date=end_date,
            is_current=is_current,
            is_active=is_active,
        ),
    )


@academic_year_router.put("/terms/{term_id}", response_model=TermResponse, dependencies=[Depends(PermissionGuard.admin_only)])
def update_term(
    term_id:    int,
    name:       Optional[str]  = Form(None),
    start_date: Optional[date] = Form(None),
    end_date:   Optional[date] = Form(None),
    is_current: Optional[bool] = Form(None),
    is_active:  Optional[bool] = Form(None),
    db: Session = Depends(get_db),
):
    return AcademicYearService.update_term(
        db,
        term_id,
        TermUpdate(
            name=name,
            start_date=start_date,
            end_date=end_date,
            is_current=is_current,
            is_active=is_active,
        ),
    )


@academic_year_router.delete("/terms/{term_id}", dependencies=[Depends(PermissionGuard.admin_only)])
def delete_term(term_id: int, db: Session = Depends(get_db)):
    return AcademicYearService.delete_term(db, term_id)