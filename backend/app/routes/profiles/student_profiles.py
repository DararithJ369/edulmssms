from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.config.security import get_current_user
from app.models.user import User
from app.services.user_profile_service import (
    StudentProfileService,
)
from app.schemas.user_profile import (
    StudentProfileCreate,
    StudentProfileUpdate,
    StudentProfileResponse,
)

student_router = APIRouter(prefix="/students", tags=["Student Profiles"])

# ─────────────────────────────────────────────────────────────────────────────
# Student profile  →  /students/{user_id}/profile
# Extends base profile with: student_id, enrolment_date
# ─────────────────────────────────────────────────────────────────────────────

@student_router.get("/{user_id}/profile", response_model=StudentProfileResponse)
def get_student_profile(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return StudentProfileService.get_student_profile(db, user_id)


@student_router.post(
    "/{user_id}/profile",
    response_model=StudentProfileResponse,
    dependencies=[Depends(PermissionGuard.admin_or_teacher)],
)
def create_student_profile(
    user_id: str,
    student_id: Optional[str] = Form(None),
    enrolment_date: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    from datetime import datetime
    return StudentProfileService.create_student_profile(
        db,
        user_id,
        StudentProfileCreate(
            student_id=student_id,
            enrolment_date=datetime.fromisoformat(enrolment_date) if enrolment_date else None,
        ),
    )


@student_router.put(
    "/{user_id}/profile",
    response_model=StudentProfileResponse,
    dependencies=[Depends(PermissionGuard.admin_or_teacher)],
)
def update_student_profile(
    user_id: str,
    student_id: Optional[str] = Form(None),
    enrolment_date: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    from datetime import datetime
    return StudentProfileService.update_student_profile(
        db,
        user_id,
        StudentProfileUpdate(
            student_id=student_id,
            enrolment_date=datetime.fromisoformat(enrolment_date) if enrolment_date else None,
        ),
    )


@student_router.delete(
    "/{user_id}/profile",
    dependencies=[Depends(PermissionGuard.admin_only)],
)
def delete_student_profile(user_id: str, db: Session = Depends(get_db)):
    return StudentProfileService.delete_student_profile(db, user_id)

