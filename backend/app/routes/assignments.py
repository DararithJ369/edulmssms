from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.config.security import get_current_user
from app.models.user import User
from app.services.assignment_service import AssignmentService
from app.schemas.assignment import AssignmentCreate, AssignmentUpdate, AssignmentResponse
from app.schemas.submission import SubmissionCreate

assignment_router = APIRouter(prefix="/assignments", tags=["Assignments"])


@assignment_router.get("")
def get_all_assignments(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    return AssignmentService.get_assignments(db, page, limit)


@assignment_router.get("/{assignment_id}", response_model=AssignmentResponse)
def get_assignment(assignment_id: int, db: Session = Depends(get_db)):
    return AssignmentService.get_assignment_by_id(db, assignment_id)


@assignment_router.post("", response_model=AssignmentResponse, dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def create_assignment(
    course_id: int = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    due_date: Optional[str] = Form(None),
    total_marks: int = Form(100),
    is_active: bool = Form(True),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    return AssignmentService.create_assignment(
        db,
        AssignmentCreate(
            course_id=course_id,
            title=title,
            description=description,
            due_date=due_date,
            total_marks=total_marks,
            is_active=is_active,
        ),
        file,
    )


@assignment_router.put("/{assignment_id}", response_model=AssignmentResponse, dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def update_assignment(
    assignment_id: int,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    due_date: Optional[str] = Form(None),
    total_marks: Optional[int] = Form(None),
    is_active: Optional[bool] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    return AssignmentService.update_assignment(
        db,
        assignment_id,
        AssignmentUpdate(
            title=title,
            description=description,
            due_date=due_date,
            total_marks=total_marks,
            is_active=is_active,
        ),
        file,
    )


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
    return AssignmentService.submit_assignment(
        db,
        assignment_id,
        current_user.id,
        SubmissionCreate(content=content),
        file,
    )