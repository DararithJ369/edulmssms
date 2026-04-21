from typing import Optional
from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.grade_service import GradeService
from app.schemas.grade import GradeCreate, GradeUpdate, GradeResponse

grade_router = APIRouter(tags=["Grades"])


# ── General grades CRUD ───────────────────────────────────────────────────────

@grade_router.get("/grades", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def get_all_grades(page: int = 1, limit: int = 10, search: str = "", db: Session = Depends(get_db)):
    return GradeService.get_grades(db, page, limit, search)


@grade_router.post("/grades", response_model=GradeResponse, dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def add_or_update_grade(
    student_id: str = Form(...),
    score: float = Form(...),
    letter_grade: Optional[str] = Form(None),
    feedback: Optional[str] = Form(None),
    assignment_id: Optional[int] = Form(None),
    exam_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
):
    return GradeService.upsert_grade(
        db,
        GradeCreate(
            student_id=student_id,
            score=score,
            letter_grade=letter_grade,
            feedback=feedback,
            assignment_id=assignment_id,
            exam_id=exam_id,
        ),
    )


@grade_router.put("/grades/{grade_id}", response_model=GradeResponse, dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def update_grade(
    grade_id: int,
    score: Optional[float] = Form(None),
    letter_grade: Optional[str] = Form(None),
    feedback: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    return GradeService.update_grade(
        db, grade_id, GradeUpdate(score=score, letter_grade=letter_grade, feedback=feedback)
    )


@grade_router.delete("/grades/{grade_id}", dependencies=[Depends(PermissionGuard.admin_only)])
def delete_grade(grade_id: int, db: Session = Depends(get_db)):
    return GradeService.delete_grade(db, grade_id)


# ── Grades per student ────────────────────────────────────────────────────────

@grade_router.get("/students/{student_id}/grades")
def get_student_grades(
    student_id: int,
    current_user=Depends(PermissionGuard.get_current_user),
    db: Session = Depends(get_db),
):
    if not PermissionGuard.can_view_student(db, current_user, str(student_id)):
        raise HTTPException(status_code=403, detail="Not authorized to view student grades")
    return GradeService.get_student_grades(db, student_id)