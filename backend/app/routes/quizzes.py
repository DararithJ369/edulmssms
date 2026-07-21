from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.config.security import get_current_user
from app.models.user import User
from app.services.quiz_service import QuizService
from app.schemas.quiz import QuizCreate, QuizUpdate, QuizResponse, QuizSubmitPayload

quiz_router = APIRouter(prefix="/quizzes", tags=["Quizzes"])


@quiz_router.get("")
def get_all_quizzes(
    page: int = 1,
    limit: int = 10,
    search: str = "",
    class_id: Optional[int] = None,
    course_id: Optional[int] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(PermissionGuard.get_current_user),
):
    return QuizService.get_quizzes(db, page, limit, search, class_id=class_id, course_id=course_id, sort_by=sort_by, sort_order=sort_order)


@quiz_router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(PermissionGuard.get_current_user),
):
    return QuizService.get_quiz_by_id(db, quiz_id)


@quiz_router.post("", response_model=QuizResponse, dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def create_quiz(payload: QuizCreate, db: Session = Depends(get_db)):
    return QuizService.create_quiz(db, payload)


@quiz_router.put("/{quiz_id}", response_model=QuizResponse, dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def update_quiz(quiz_id: int, payload: QuizUpdate, db: Session = Depends(get_db)):
    return QuizService.update_quiz(db, quiz_id, payload)


@quiz_router.delete("/{quiz_id}", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def delete_quiz(quiz_id: int, db: Session = Depends(get_db)):
    return QuizService.delete_quiz(db, quiz_id)


# ── Submit & results ──────────────────────────────────────────────────────────

@quiz_router.post("/{quiz_id}/submit")
def submit_quiz(
    quiz_id: int,
    payload: QuizSubmitPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return QuizService.submit_quiz(db, quiz_id, current_user.id, payload)


@quiz_router.get("/{quiz_id}/results", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def get_quiz_results(quiz_id: int, db: Session = Depends(get_db)):
    return QuizService.get_quiz_results(db, quiz_id)