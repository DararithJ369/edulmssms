from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.user_profile import UserProfile
from app.models.parent_profile import ParentProfile
from app.models.student_profile import StudentProfile
from app.schemas.user import (
    ParentProfileCreate,
    ParentProfileUpdate,
    ParentProfileResponse,
    ParentFullResponse,
)
from app.services.base_service import paginate, apply_update


class ParentProfileService:

    @staticmethod
    def _get_base(db: Session, user_id: str) -> UserProfile:
        """Fetch base UserProfile or raise — required before touching parent rows."""
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        if not profile:
            raise HTTPException(
                status_code=404,
                detail="Base profile not found. Create a user profile first.",
            )
        return profile

    @staticmethod
    def _get_parent_extension(db: Session, user_id: str) -> ParentProfile:
        """Fetch the parent extension or raise 404."""
        profile = ParentProfileService._get_base(db, user_id)
        if not profile.parent_profile:
            raise HTTPException(status_code=404, detail="Parent profile not found")
        return profile.parent_profile

    # ── CRUD ──────────────────────────────────────────────────────────────────
    
    @staticmethod
    def setup_form(db: Session) -> dict:
        """Return field info for frontend form generation."""
        return {
            "fields": {
                "relationship":    {"type": "string", "required": False, "hint": "e.g. Father, Mother, Guardian"},
                "occupation":      {"type": "string", "required": False},
                "emergency_phone": {"type": "string", "required": False},
            }
        }

    @staticmethod
    def get_parent_profiles(db: Session, page: int = 1, limit: int = 10) -> dict:
        return paginate(db, ParentProfile, ParentProfileResponse, ParentProfile.created_at.desc(), page, limit)

    @staticmethod
    def get_parent_profile(db: Session, user_id: str) -> ParentFullResponse:
        profile = ParentProfileService._get_base(db, user_id)
        return ParentFullResponse.model_validate(profile)

    @staticmethod
    def create_parent_profile(
        db: Session,
        user_id: str,
        parent_in: ParentProfileCreate,
    ) -> ParentFullResponse:
        profile = ParentProfileService._get_base(db, user_id)

        if profile.parent_profile:
            raise HTTPException(status_code=400, detail="Parent profile already exists")

        parent = ParentProfile(
            profile_id=profile.id,
            occupation=parent_in.occupation,
            relationship=parent_in.relationship,
            emergency_phone=parent_in.emergency_phone,
        )
        db.add(parent)
        db.commit()
        db.refresh(profile)
        return ParentFullResponse.model_validate(profile)

    @staticmethod
    def update_parent_profile(
        db: Session,
        user_id: str,
        parent_in: ParentProfileUpdate,
    ) -> ParentFullResponse:
        parent = ParentProfileService._get_parent_extension(db, user_id)

        apply_update(parent, parent_in)

        db.commit()
        db.refresh(parent.profile)
        return ParentFullResponse.model_validate(parent.profile)

    @staticmethod
    def delete_parent_profile(db: Session, user_id: str) -> dict:
        parent = ParentProfileService._get_parent_extension(db, user_id)
        db.delete(parent)
        db.commit()
        return {"detail": "Parent profile deleted successfully"}

    # ── Student links ─────────────────────────────────────────────────────────

    @staticmethod
    def get_students(db: Session, user_id: str) -> list:
        parent = ParentProfileService._get_parent_extension(db, user_id)
        
        from sqlalchemy.orm import joinedload
        from app.schemas.user import StudentNested

        student_ids = [s.id for s in parent.students]
        
        if not student_ids:
            return []

        fully_loaded_students = (
            db.query(StudentProfile)
            .options(
                joinedload(StudentProfile.profile)
                .joinedload(UserProfile.user),
                joinedload(StudentProfile.grade_level) 
            )
            .filter(StudentProfile.id.in_(student_ids))
            .all()
        )

        return [StudentNested.model_validate(s) for s in fully_loaded_students]

    @staticmethod
    def link_student(db: Session, user_id: str, student_profile_id: int) -> ParentFullResponse:
        """Link a student to this parent."""
        parent = ParentProfileService._get_parent_extension(db, user_id)

        student = db.query(StudentProfile).filter(StudentProfile.id == student_profile_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student profile not found")

        if student in parent.students:
            raise HTTPException(status_code=400, detail="Student already linked to this parent")

        parent.students.append(student)
        db.commit()
        db.refresh(parent.profile)
        return ParentFullResponse.model_validate(parent.profile)

    @staticmethod
    def unlink_student(db: Session, user_id: str, student_profile_id: int) -> dict:
        """Remove a student link from this parent."""
        parent = ParentProfileService._get_parent_extension(db, user_id)

        student = db.query(StudentProfile).filter(StudentProfile.id == student_profile_id).first()
        if not student or student not in parent.students:
            raise HTTPException(status_code=404, detail="Student not linked to this parent")

        parent.students.remove(student)
        db.commit()
        return {"detail": "Student unlinked successfully"}