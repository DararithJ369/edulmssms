from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.config.security import get_current_user
from app.models.user import User
from app.services.user_profile_service import (
    UserProfileService,
)
from app.schemas.user_profile import (
    UserProfileBase,
    UserProfileResponse,
)

profile_router = APIRouter(prefix="/profiles", tags=["Profiles"])


# ─────────────────────────────────────────────────────────────────────────────
# Base profile  →  /users/{user_id}/profile
# ─────────────────────────────────────────────────────────────────────────────

@profile_router.get("",dependencies=[Depends(PermissionGuard.admin_only)],
)
def get_all_profiles(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    return UserProfileService.get_profiles(db, page, limit)


@profile_router.get("/{user_id}", response_model=UserProfileResponse)
def get_user_profile(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return UserProfileService.get_profile_by_user_id(db, user_id)


@profile_router.post("/{user_id}", response_model=UserProfileResponse)
def create_user_profile(
    user_id: str,
    full_name: Optional[str] = Form(None),
    bio: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return UserProfileService.create_profile(
        db,
        user_id,
        UserProfileBase(full_name=full_name, bio=bio, phone=phone, address=address),
        image,
    )


@profile_router.put("/{user_id}", response_model=UserProfileResponse)
def update_user_profile(
    user_id: str,
    full_name: Optional[str] = Form(None),
    bio: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return UserProfileService.update_profile(
        db,
        user_id,
        UserProfileBase(full_name=full_name, bio=bio, phone=phone, address=address),
        image,
    )


@profile_router.delete("/{user_id}", dependencies=[Depends(PermissionGuard.admin_only)])
def delete_user_profile(user_id: str, db: Session = Depends(get_db)):
    return UserProfileService.delete_profile(db, user_id)


@profile_router.patch(
    "/{user_id}/class",
    response_model=UserProfileResponse,
    dependencies=[Depends(PermissionGuard.admin_or_instructor)],
)
def assign_class(
    user_id: str,
    class_id: int = Form(...),
    db: Session = Depends(get_db),
):
    return UserProfileService.update_class(db, user_id, class_id)
