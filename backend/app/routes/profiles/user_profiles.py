from typing import Optional, Union
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.models.user import User
from app.services.user_profile_service import (
    UserProfileService,
)
from app.schemas.user_profile import (
    UserProfileBase,
    UserProfileResponse,
    InstructorProfileResponse,
    StudentProfileResponse,
    ParentFullResponse,
)

profile_router = APIRouter(prefix="/profiles", tags=["Profiles"])


# ─────────────────────────────────────────────────────────────────────────────
# Base profile  →  /users/{user_id}/profile
# ─────────────────────────────────────────────────────────────────────────────

@profile_router.get("",dependencies=[Depends(PermissionGuard.admin_only)],
)
def get_all_profiles(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    return UserProfileService.get_profiles(db, page, limit)


@profile_router.get("/{user_id}", response_model=Union[InstructorProfileResponse, StudentProfileResponse, ParentFullResponse, UserProfileResponse])
def get_user_profile(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard.get_current_user),
):
    if current_user.role.name.lower() != "admin" and str(current_user.id) != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return UserProfileService.get_profile_by_user_id(db, user_id)


@profile_router.post("/{user_id}", response_model=Union[InstructorProfileResponse, StudentProfileResponse, ParentFullResponse, UserProfileResponse])
def create_user_profile(
    user_id: str,
    full_name: Optional[str] = Form(None),
    bio: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    date_of_birth: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    national_id: Optional[str] = Form(None),
    nationality: Optional[str] = Form(None),
    website: Optional[str] = Form(None),
    linkedin: Optional[str] = Form(None),
    emergency_contact_name: Optional[str] = Form(None),
    emergency_contact_phone: Optional[str] = Form(None),
    emergency_contact_relationship: Optional[str] = Form(None),
    blood_type: Optional[str] = Form(None),
    medical_conditions: Optional[str] = Form(None),
    pfp: Optional[str] = Form(None),
    tier: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    # Instructor fields
    department: Optional[str] = Form(None),
    position: Optional[str] = Form(None),
    office: Optional[str] = Form(None),
    # Student fields
    student_id: Optional[str] = Form(None),
    enrolment_date: Optional[str] = Form(None),
    grade_level_id: Optional[int] = Form(None),
    previous_school: Optional[str] = Form(None),
    scholarship_status: Optional[str] = Form(None),
    special_needs: Optional[str] = Form(None),
    # Parent fields
    occupation: Optional[str] = Form(None),
    relationship: Optional[str] = Form(None),
    emergency_phone: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard.get_current_user),
):
    if current_user.role.name.lower() != "admin" and str(current_user.id) != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return UserProfileService.create_profile(
        db,
        user_id,
        UserProfileBase(
            full_name=full_name,
            bio=bio,
            pfp=pfp,
            phone=phone,
            address=address,
            date_of_birth=date_of_birth,
            gender=gender,
            national_id=national_id,
            nationality=nationality,
            website=website,
            linkedin=linkedin,
            emergency_contact_name=emergency_contact_name,
            emergency_contact_phone=emergency_contact_phone,
            emergency_contact_relationship=emergency_contact_relationship,
            blood_type=blood_type,
            medical_conditions=medical_conditions,
            tier=tier,
        ),

        image,
        department=department,
        position=position,
        office=office,
        student_id=student_id,
        enrolment_date=enrolment_date,
        grade_level_id=grade_level_id,
        previous_school=previous_school,
        scholarship_status=scholarship_status,
        special_needs=special_needs,
        occupation=occupation,
        relationship=relationship,
        emergency_phone=emergency_phone,
    )


@profile_router.put("/{user_id}", response_model=Union[InstructorProfileResponse, StudentProfileResponse, ParentFullResponse, UserProfileResponse])
def update_user_profile(
    user_id: str,
    full_name: Optional[str] = Form(None),
    bio: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    date_of_birth: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    national_id: Optional[str] = Form(None),
    nationality: Optional[str] = Form(None),
    website: Optional[str] = Form(None),
    linkedin: Optional[str] = Form(None),
    emergency_contact_name: Optional[str] = Form(None),
    emergency_contact_phone: Optional[str] = Form(None),
    emergency_contact_relationship: Optional[str] = Form(None),
    blood_type: Optional[str] = Form(None),
    medical_conditions: Optional[str] = Form(None),
    pfp: Optional[str] = Form(None),
    tier: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    delete_image: Optional[str] = Form(None),
    # Instructor fields
    department: Optional[str] = Form(None),
    position: Optional[str] = Form(None),
    office: Optional[str] = Form(None),
    # Student fields
    student_id: Optional[str] = Form(None),
    enrolment_date: Optional[str] = Form(None),
    grade_level_id: Optional[int] = Form(None),
    previous_school: Optional[str] = Form(None),
    scholarship_status: Optional[str] = Form(None),
    special_needs: Optional[str] = Form(None),
    # Parent fields
    occupation: Optional[str] = Form(None),
    relationship: Optional[str] = Form(None),
    emergency_phone: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard.get_current_user),
):
    if current_user.role.name.lower() != "admin" and str(current_user.id) != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return UserProfileService.update_profile(
        db,
        user_id,
        UserProfileBase(
            full_name=full_name,
            bio=bio,
            pfp=pfp,
            phone=phone,
            address=address,
            date_of_birth=date_of_birth,
            gender=gender,
            national_id=national_id,
            nationality=nationality,
            website=website,
            linkedin=linkedin,
            emergency_contact_name=emergency_contact_name,
            emergency_contact_phone=emergency_contact_phone,
            emergency_contact_relationship=emergency_contact_relationship,
            blood_type=blood_type,
            medical_conditions=medical_conditions,
            tier=tier,
        ),

        image,
        delete_image=delete_image == "true",
        department=department,
        position=position,
        office=office,
        student_id=student_id,
        enrolment_date=enrolment_date,
        grade_level_id=grade_level_id,
        previous_school=previous_school,
        scholarship_status=scholarship_status,
        special_needs=special_needs,
        occupation=occupation,
        relationship=relationship,
        emergency_phone=emergency_phone,
    )


@profile_router.delete("/{user_id}", dependencies=[Depends(PermissionGuard.admin_only)])
def delete_user_profile(user_id: str, db: Session = Depends(get_db)):
    return UserProfileService.delete_profile(db, user_id)


@profile_router.post("/{user_id}/image", response_model=dict)
def upload_profile_image(
    user_id: str,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard.get_current_user),
):
    if current_user.role.name.lower() != "admin" and str(current_user.id) != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    from app.models.user_profile import UserProfile
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    from app.utils.get_image import get_image
    try:
        saved_path = get_image(image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    profile.image = saved_path
    db.commit()
    db.refresh(profile)

    return {
        "detail": "Avatar uploaded successfully",
        "image": saved_path,
        "image_url": saved_path
    }


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
