from typing import Optional
from fastapi import APIRouter, Depends, Form
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.config.security import get_current_user
from app.models.user import User
from app.services.exam_service import ExamService
from app.schemas.exam import ExamCreate, ExamUpdate, ExamResponse, ExamSubmitPayload

exam_router = APIRouter(prefix="/exams", tags=["Exams"])


# ── Static sub-paths — MUST be before /{exam_id} ─────────────────────────────


@exam_router.put(
    "/results/{result_id}/grade",
    dependencies=[Depends(PermissionGuard.admin_or_instructor)]
)
def grade_exam_result(
    result_id: int,
    score: float = Form(...),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    return ExamService.grade_result(db, result_id, score, notes or "")


# ── Collection ────────────────────────────────────────────────────────────────


@exam_router.get("")
def get_all_exams(
    page: int = 1,
    limit: int = 10,
    class_id: Optional[int] = None,
    course_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    return ExamService.get_exams(db, page, limit, class_id=class_id, course_id=course_id)


@exam_router.post(
    "", 
    response_model=ExamResponse, 
    dependencies=[Depends(PermissionGuard.admin_or_instructor)]
)
def create_exam(payload: ExamCreate, db: Session = Depends(get_db)):
    return ExamService.create_exam(db, payload)


# ── Dynamic /{exam_id} — MUST be last ────────────────────────────────────────


@exam_router.get("/{exam_id}", response_model=ExamResponse)
def get_exam(exam_id: int, db: Session = Depends(get_db)):
    return ExamService.get_exam_by_id(db, exam_id)


@exam_router.put(
    "/{exam_id}", 
    response_model=ExamResponse, 
    dependencies=[Depends(PermissionGuard.admin_or_instructor)]
)
def update_exam(exam_id: int, payload: ExamUpdate, db: Session = Depends(get_db)):
    return ExamService.update_exam(db, exam_id, payload)


@exam_router.delete("/{exam_id}", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def delete_exam(exam_id: int, db: Session = Depends(get_db)):
    return ExamService.delete_exam(db, exam_id)


@exam_router.post("/{exam_id}/submit")
def submit_exam(
    exam_id: int,
    payload: ExamSubmitPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ExamService.submit_exam(db, exam_id, current_user.id, payload)


@exam_router.get("/{exam_id}/results", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def get_exam_results(exam_id: int, db: Session = Depends(get_db)):
    return ExamService.get_exam_results(db, exam_id)
