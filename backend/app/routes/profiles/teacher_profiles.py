from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.config.security import get_current_user
from app.models.user import User
from app.services.user_profile_service import (
    TeacherProfileService,
)
from app.schemas.user_profile import (
    TeacherProfileCreate,
    TeacherProfileUpdate,
    TeacherProfileResponse,
)

teacher_router = APIRouter(prefix="/teachers", tags=["Teacher Profiles"])

# ─────────────────────────────────────────────────────────────────────────────
# Teacher profile  →  /teachers/{user_id}/profile
# Extends base profile with: department, position, office
# ─────────────────────────────────────────────────────────────────────────────

@teacher_router.get("/{user_id}/profile", response_model=TeacherProfileResponse)
def get_teacher_profile(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return TeacherProfileService.get_teacher_profile(db, user_id)


@teacher_router.post(
    "/{user_id}/profile",
    response_model=TeacherProfileResponse,
    dependencies=[Depends(PermissionGuard.admin_only)],
)
def create_teacher_profile(
    user_id: str,
    department: Optional[str] = Form(None),
    position: Optional[str] = Form(None),
    office: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    return TeacherProfileService.create_teacher_profile(
        db,
        user_id,
        TeacherProfileCreate(department=department, position=position, office=office),
    )


@teacher_router.put(
    "/{user_id}/profile",
    response_model=TeacherProfileResponse,
    dependencies=[Depends(PermissionGuard.admin_only)],
)
def update_teacher_profile(
    user_id: str,
    department: Optional[str] = Form(None),
    position: Optional[str] = Form(None),
    office: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    return TeacherProfileService.update_teacher_profile(
        db,
        user_id,
        TeacherProfileUpdate(department=department, position=position, office=office),
    )


@teacher_router.delete(
    "/{user_id}/profile",
    dependencies=[Depends(PermissionGuard.admin_only)],
)
def delete_teacher_profile(user_id: str, db: Session = Depends(get_db)):
    return TeacherProfileService.delete_teacher_profile(db, user_id)