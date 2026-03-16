from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from app.models.user_profile import UserProfile
from app.models.student_profile import StudentProfile
from app.models.teacher_profile import TeacherProfile
from app.models.user import User
from app.schemas.user_profile import (
    UserProfileBase,
    UserProfileResponse,
    StudentProfileCreate,
    StudentProfileUpdate,
    StudentProfileResponse,
    TeacherProfileCreate,
    TeacherProfileUpdate,
    TeacherProfileResponse,
)
from app.utils.get_image import get_image


class UserProfileService:

    # ── Base profile CRUD ─────────────────────────────────────────────────────

    @staticmethod
    def get_profiles(db: Session, page: int = 1, limit: int = 10) -> dict:
        total = db.query(func.count(UserProfile.id)).scalar()
        profiles = (
            db.query(UserProfile)
            .order_by(UserProfile.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return {
            "data": [UserProfileResponse.model_validate(p) for p in profiles],
            "meta": {"page": page, "total": total, "limit": limit},
        }

    @staticmethod
    def get_profile_by_user_id(db: Session, user_id: str) -> UserProfileResponse:
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        return UserProfileResponse.model_validate(profile)

    @staticmethod
    def create_profile(
        db: Session,
        user_id: str,
        profile_in: UserProfileBase,
        image: Optional[UploadFile] = None,
    ) -> UserProfileResponse:
        if not db.query(User).filter(User.id == user_id).first():
            raise HTTPException(status_code=404, detail="User not found")

        if db.query(UserProfile).filter(UserProfile.user_id == user_id).first():
            raise HTTPException(status_code=400, detail="Profile already exists for this user")

        profile = UserProfile(
            user_id=user_id,
            full_name=profile_in.full_name,
            bio=profile_in.bio,
            phone=profile_in.phone,
            address=profile_in.address,
            image=get_image(image) if image else profile_in.pfp,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return UserProfileResponse.model_validate(profile)

    @staticmethod
    def update_profile(
        db: Session,
        user_id: str,
        profile_in: UserProfileBase,
        image: Optional[UploadFile] = None,
    ) -> UserProfileResponse:
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")

        update_data = profile_in.model_dump(exclude_unset=True)
        # remap pfp → image
        if "pfp" in update_data:
            update_data["image"] = update_data.pop("pfp")

        for field, value in update_data.items():
            setattr(profile, field, value)

        if image:
            profile.image = get_image(image)

        db.commit()
        db.refresh(profile)
        return UserProfileResponse.model_validate(profile)

    @staticmethod
    def delete_profile(db: Session, user_id: str) -> dict:
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        db.delete(profile)
        db.commit()
        return {"detail": "Profile deleted successfully"}

    @staticmethod
    def update_class(db: Session, user_id: str, class_id: int) -> UserProfileResponse:
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        profile.class_id = class_id
        db.commit()
        db.refresh(profile)
        return UserProfileResponse.model_validate(profile)


# ── Student extension ─────────────────────────────────────────────────────────

class StudentProfileService:

    @staticmethod
    def _get_base(db: Session, user_id: str) -> UserProfile:
        """Fetch base profile or raise — required before touching student rows."""
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        if not profile:
            raise HTTPException(
                status_code=404,
                detail="Base profile not found. Create a user profile first.",
            )
        return profile

    @staticmethod
    def get_student_profile(db: Session, user_id: str) -> StudentProfileResponse:
        profile = StudentProfileService._get_base(db, user_id)
        return StudentProfileResponse.model_validate(profile)

    @staticmethod
    def create_student_profile(
        db: Session, user_id: str, student_in: StudentProfileCreate
    ) -> StudentProfileResponse:
        profile = StudentProfileService._get_base(db, user_id)

        if profile.student_profile:
            raise HTTPException(status_code=400, detail="Student profile already exists")

        student = StudentProfile(
            profile_id=profile.id,
            student_id=student_in.student_id,
            enrolment_date=student_in.enrolment_date,
        )
        db.add(student)
        db.commit()
        db.refresh(profile)
        return StudentProfileResponse.model_validate(profile)

    @staticmethod
    def update_student_profile(
        db: Session, user_id: str, student_in: StudentProfileUpdate
    ) -> StudentProfileResponse:
        profile = StudentProfileService._get_base(db, user_id)

        if not profile.student_profile:
            raise HTTPException(status_code=404, detail="Student profile not found")

        for field, value in student_in.model_dump(exclude_unset=True).items():
            setattr(profile.student_profile, field, value)

        db.commit()
        db.refresh(profile)
        return StudentProfileResponse.model_validate(profile)

    @staticmethod
    def delete_student_profile(db: Session, user_id: str) -> dict:
        profile = StudentProfileService._get_base(db, user_id)
        if not profile.student_profile:
            raise HTTPException(status_code=404, detail="Student profile not found")
        db.delete(profile.student_profile)
        db.commit()
        return {"detail": "Student profile deleted successfully"}


# ── Teacher extension ─────────────────────────────────────────────────────────

class TeacherProfileService:

    @staticmethod
    def _get_base(db: Session, user_id: str) -> UserProfile:
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        if not profile:
            raise HTTPException(
                status_code=404,
                detail="Base profile not found. Create a user profile first.",
            )
        return profile

    @staticmethod
    def get_teacher_profile(db: Session, user_id: str) -> TeacherProfileResponse:
        profile = TeacherProfileService._get_base(db, user_id)
        return TeacherProfileResponse.model_validate(profile)

    @staticmethod
    def create_teacher_profile(
        db: Session, user_id: str, teacher_in: TeacherProfileCreate
    ) -> TeacherProfileResponse:
        profile = TeacherProfileService._get_base(db, user_id)

        if profile.teacher_profile:
            raise HTTPException(status_code=400, detail="Teacher profile already exists")

        teacher = TeacherProfile(
            profile_id=profile.id,
            department=teacher_in.department,
            position=teacher_in.position,
            office=teacher_in.office,
        )
        db.add(teacher)
        db.commit()
        db.refresh(profile)
        return TeacherProfileResponse.model_validate(profile)

    @staticmethod
    def update_teacher_profile(
        db: Session, user_id: str, teacher_in: TeacherProfileUpdate
    ) -> TeacherProfileResponse:
        profile = TeacherProfileService._get_base(db, user_id)

        if not profile.teacher_profile:
            raise HTTPException(status_code=404, detail="Teacher profile not found")

        for field, value in teacher_in.model_dump(exclude_unset=True).items():
            setattr(profile.teacher_profile, field, value)

        db.commit()
        db.refresh(profile)
        return TeacherProfileResponse.model_validate(profile)

    @staticmethod
    def delete_teacher_profile(db: Session, user_id: str) -> dict:
        profile = TeacherProfileService._get_base(db, user_id)
        if not profile.teacher_profile:
            raise HTTPException(status_code=404, detail="Teacher profile not found")
        db.delete(profile.teacher_profile)
        db.commit()
        return {"detail": "Teacher profile deleted successfully"}