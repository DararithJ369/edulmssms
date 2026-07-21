from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.config.security import get_current_user
from app.models.user import User
from app.services.assignment_service import AssignmentService
from app.schemas.assignment import AssignmentCreate, AssignmentUpdate, AssignmentResponse
from app.schemas.submission import SubmissionCreate
from app.utils.upload_validator import validate_upload

assignment_router = APIRouter(prefix="/assignments", tags=["Assignments"])


@assignment_router.get("")
def get_all_assignments(
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
    return AssignmentService.get_assignments(db, page, limit, search, class_id=class_id, course_id=course_id, sort_by=sort_by, sort_order=sort_order)


@assignment_router.get("/{assignment_id}", response_model=AssignmentResponse)
def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(PermissionGuard.get_current_user),
):
    return AssignmentService.get_assignment_by_id(db, assignment_id)


@assignment_router.post("", response_model=AssignmentResponse, dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def create_assignment(
    payload: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    # Resolve course_id from lesson_id if not explicitly provided
    if not payload.course_id and payload.lesson_id:
        from app.models.course import Lesson
        lesson = db.query(Lesson).filter(Lesson.id == payload.lesson_id).first()
        if lesson and lesson.module:
            payload.course_id = lesson.module.course_id
        else:
            raise HTTPException(status_code=400, detail="Invalid lesson_id, cannot resolve course_id")

    if not payload.course_id:
        raise HTTPException(status_code=400, detail="course_id is required")

    # Set teacher_id to current user ID
    if not payload.teacher_id:
        payload.teacher_id = str(current_user.id)

    return AssignmentService.create_assignment(db, payload)


@assignment_router.put("/{assignment_id}", response_model=AssignmentResponse, dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def update_assignment(
    assignment_id: int,
    payload: AssignmentUpdate,
    db: Session = Depends(get_db),
):
    if payload.lesson_id:
        from app.models.course import Lesson
        lesson = db.query(Lesson).filter(Lesson.id == payload.lesson_id).first()
        if lesson and lesson.module:
            payload.course_id = lesson.module.course_id

    return AssignmentService.update_assignment(db, assignment_id, payload)


@assignment_router.delete("/{assignment_id}", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    return AssignmentService.delete_assignment(db, assignment_id)


# ── Submissions ───────────────────────────────────────────────────────────────

@assignment_router.get("/{assignment_id}/submissions", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def get_assignment_submissions(assignment_id: int, db: Session = Depends(get_db)):
    return AssignmentService.get_submissions(db, assignment_id)


@assignment_router.post("/{assignment_id}/submit")
def submit_assignment(
    assignment_id: int,
    content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file:
        validate_upload(file, allowed_categories=["image", "document", "video"])
    return AssignmentService.submit_assignment(
        db,
        assignment_id,
        current_user.id,
        SubmissionCreate(
            submission_type="assignment",
            reference_id=assignment_id,
            student_id=str(current_user.id),
            submission_text=content
        ),
        file,
    )