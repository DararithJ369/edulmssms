from typing import Optional
from fastapi import APIRouter, Depends, Form
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.subject_service import SubjectService
from app.schemas.subject import SubjectCreate, SubjectUpdate, SubjectResponse

subject_router = APIRouter(prefix="/subjects", tags=["Subjects"])


# ── Static paths ──────────────────────────────────────────────────────────────


@subject_router.get("/setup-form", dependencies=[Depends(PermissionGuard.admin_only)])
def setup_form(db: Session = Depends(get_db)):
    return SubjectService.setup_form(db)


# ── Collection ────────────────────────────────────────────────────────────────


@subject_router.get("")
def get_all_subjects(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    return SubjectService.get_subjects(db, page, limit)


@subject_router.post(
    "", 
    response_model=SubjectResponse, 
    dependencies=[Depends(PermissionGuard.admin_only)]
)
def create_subject(
    teacher_id: str = Form(...),
    name: str = Form(...),
    code: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    credits: int = Form(3),
    hours_per_week: Optional[int] = Form(None),
    is_active: bool = Form(True),
    db: Session = Depends(get_db),
):
    return SubjectService.create_subject(
        db,
        SubjectCreate(
            instructor_id=teacher_id,
            name=name,
            code=code,
            description=description,
            credits=credits,
            hours_per_week=hours_per_week,
            is_active=is_active,
        ),
    )


# ── Dynamic /{subject_id} — MUST be last ─────────────────────────────────────


@subject_router.get("/{subject_id}", response_model=SubjectResponse)
def get_subject(subject_id: int, db: Session = Depends(get_db)):
    return SubjectService.get_subject_by_id(db, subject_id)


@subject_router.put("/{subject_id}", response_model=SubjectResponse, dependencies=[Depends(PermissionGuard.admin_only)])
def update_subject(
    subject_id: int,
    teacher_id: Optional[str] = Form(None),
    name: Optional[str] = Form(None),
    code: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    credits: Optional[int] = Form(None),
    hours_per_week: Optional[int] = Form(None),
    is_active: Optional[bool] = Form(None),
    db: Session = Depends(get_db),
):
    return SubjectService.update_subject(
        db,
        subject_id,
        SubjectUpdate(
            instructor_id=teacher_id,
            name=name,
            code=code,
            description=description,
            credits=credits,
            hours_per_week=hours_per_week,
            is_active=is_active,
        ),
    )


@subject_router.delete("/{subject_id}", dependencies=[Depends(PermissionGuard.admin_only)])
def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    return SubjectService.delete_subject(db, subject_id)


@subject_router.get("/{subject_id}/courses")
def get_subject_courses(subject_id: int, db: Session = Depends(get_db)):
    return SubjectService.get_subject_courses(db, subject_id)