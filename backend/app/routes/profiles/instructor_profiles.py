from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.config.security import get_current_user
from app.models.user import User
from app.models.class_ import Class
from app.services.user_profile_service import (
    InstructorProfileService,
)
from app.schemas.user_profile import (
    InstructorProfileCreate,
    InstructorProfileUpdate,
    InstructorProfileResponse,
)
from app.schemas.class_ import ClassResponse

instructor_router = APIRouter(prefix="/instructors", tags=["Instructor Profiles"])

# ─────────────────────────────────────────────────────────────────────────────
# Instructor profile  →  /instructors/{user_id}/profile
# Extends base profile with: department, position, office
# ─────────────────────────────────────────────────────────────────────────────

@instructor_router.get("/{user_id}/profile", response_model=InstructorProfileResponse)
def get_instructor_profile(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return InstructorProfileService.get_instructor_profile(db, user_id)


@instructor_router.post(
    "/{user_id}/profile",
    response_model=InstructorProfileResponse,
    dependencies=[Depends(PermissionGuard.admin_only)],
)
def create_instructor_profile(
    user_id: str,
    department: Optional[str] = Form(None),
    position: Optional[str] = Form(None),
    office: Optional[str] = Form(None),
    hire_date: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    return InstructorProfileService.create_instructor_profile(
        db,
        user_id,
        InstructorProfileCreate(department=department, position=position, office=office, hire_date=hire_date),
    )


@instructor_router.put(
    "/{user_id}/profile",
    response_model=InstructorProfileResponse,
    dependencies=[Depends(PermissionGuard.admin_only)],
)
def update_instructor_profile(
    user_id: str,
    department: Optional[str] = Form(None),
    position: Optional[str] = Form(None),
    office: Optional[str] = Form(None),
    hire_date: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    return InstructorProfileService.update_instructor_profile(
        db,
        user_id,
        InstructorProfileUpdate(department=department, position=position, office=office, hire_date=hire_date),
    )


@instructor_router.delete(
    "/{user_id}/profile",
    dependencies=[Depends(PermissionGuard.admin_only)],
)
def delete_instructor_profile(user_id: str, db: Session = Depends(get_db)):
    return InstructorProfileService.delete_instructor_profile(db, user_id)


# ─────────────────────────────────────────────────────────────────────────────
# Classes supervised by instructor  →  /instructors/{user_id}/classes
# ─────────────────────────────────────────────────────────────────────────────

@instructor_router.get("/{user_id}/classes", response_model=List[ClassResponse])
def get_instructor_classes(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Return all classes where this instructor is the supervisor."""
    classes = (
        db.query(Class)
        .filter(Class.supervisor_id == user_id)
        .all()
    )
    return [ClassResponse.model_validate(c) for c in classes]