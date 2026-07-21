from typing import Optional
from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.config.security import get_current_user
from app.models.user import User
from app.services.parent_profile_service import ParentProfileService
from app.schemas.user import (
    ParentProfileCreate,
    ParentProfileUpdate,
    ParentFullResponse,
)

parent_router = APIRouter(prefix="/parents", tags=["Parent Profiles"])


# ── Setup form ────────────────────────────────────────────────────────────────

@parent_router.get("/setup-form", dependencies=[Depends(PermissionGuard.admin_only)])
def setup_form(db: Session = Depends(get_db)):
    return ParentProfileService.setup_form(db)


# ── Admin: list all parent profiles ──────────────────────────────────────────

@parent_router.get("", dependencies=[Depends(PermissionGuard.admin_only)])
def get_all_parents(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    return ParentProfileService.get_parent_profiles(db, page, limit)


# ── Per-user parent profile ───────────────────────────────────────────────────

@parent_router.get("/{user_id}/profile", response_model=ParentFullResponse)
def get_parent_profile(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_owner = str(current_user.id) == user_id
    is_staff = current_user.is_superuser or (
        current_user.role and current_user.role.name in ["admin", "instructor", "teacher"]
    )
    if not (is_owner or is_staff):
        raise HTTPException(status_code=403, detail="Forbidden")
    return ParentProfileService.get_parent_profile(db, user_id)


@parent_router.post(
    "/{user_id}/profile",
    response_model=ParentFullResponse,
    dependencies=[Depends(PermissionGuard.admin_only)],
)
def create_parent_profile(
    user_id: str,
    occupation:      Optional[str] = Form(None),
    relationship:    Optional[str] = Form(None),
    emergency_phone: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    return ParentProfileService.create_parent_profile(
        db,
        user_id,
        ParentProfileCreate(
            occupation=occupation,
            relationship=relationship,
            emergency_phone=emergency_phone,
        ),
    )


@parent_router.put(
    "/{user_id}/profile",
    response_model=ParentFullResponse,
    dependencies=[Depends(PermissionGuard.admin_only)],
)
def update_parent_profile(
    user_id: str,
    occupation:      Optional[str] = Form(None),
    relationship:    Optional[str] = Form(None),
    emergency_phone: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    return ParentProfileService.update_parent_profile(
        db,
        user_id,
        ParentProfileUpdate(
            occupation=occupation,
            relationship=relationship,
            emergency_phone=emergency_phone,
        ),
    )


@parent_router.delete(
    "/{user_id}/profile",
    dependencies=[Depends(PermissionGuard.admin_only)],
)
def delete_parent_profile(user_id: str, db: Session = Depends(get_db)):
    return ParentProfileService.delete_parent_profile(db, user_id)


# ── Student links ─────────────────────────────────────────────────────────────

@parent_router.get("/{user_id}/students")
def get_linked_students(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_owner = str(current_user.id) == user_id
    is_staff = current_user.is_superuser or (
        current_user.role and current_user.role.name in ["admin", "instructor", "teacher"]
    )
    if not (is_owner or is_staff):
        raise HTTPException(status_code=403, detail="Forbidden")
    return ParentProfileService.get_students(db, user_id)


@parent_router.post(
    "/{user_id}/students/{student_profile_id}",
    response_model=ParentFullResponse,
    dependencies=[Depends(PermissionGuard.admin_only)],
)
def link_student(
    user_id: str,
    student_profile_id: int,
    db: Session = Depends(get_db),
):
    return ParentProfileService.link_student(db, user_id, student_profile_id)


@parent_router.delete(
    "/{user_id}/students/{student_profile_id}",
    dependencies=[Depends(PermissionGuard.admin_only)],
)
def unlink_student(
    user_id: str,
    student_profile_id: int,
    db: Session = Depends(get_db),
):
    return ParentProfileService.unlink_student(db, user_id, student_profile_id)