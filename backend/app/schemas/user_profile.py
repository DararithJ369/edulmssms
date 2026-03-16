from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


# ── Base ──────────────────────────────────────────────────────────────────────

class UserProfileBase(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    pfp: Optional[str] = None           # maps to `image` column in model
    phone: Optional[str] = None
    address: Optional[str] = None


# ── Student extension ─────────────────────────────────────────────────────────

class StudentProfileCreate(BaseModel):
    student_id: Optional[str] = None
    enrolment_date: Optional[datetime] = None


class StudentProfileUpdate(BaseModel):
    student_id: Optional[str] = None
    enrolment_date: Optional[datetime] = None


class StudentProfileNested(BaseModel):
    id: int
    student_id: Optional[str] = None
    enrolment_date: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Parent extension ─────────────────────────────────────────────────────────

class StudentNested(BaseModel):
    id: int
    student_id: Optional[str] = None
    enrolment_date: Optional[datetime] = None
 
    model_config = {"from_attributes": True}


class ParentProfileCreate(BaseModel):
    occupation:      Optional[str] = None
    relationship:    Optional[str] = None   # "Father" | "Mother" | "Guardian"
    emergency_phone: Optional[str] = None
 
 
class ParentProfileUpdate(BaseModel):
    occupation:      Optional[str] = None
    relationship:    Optional[str] = None
    emergency_phone: Optional[str] = None


# ── Teacher extension ─────────────────────────────────────────────────────────

class TeacherProfileCreate(BaseModel):
    department: Optional[str] = None
    position: Optional[str] = None
    office: Optional[str] = None


class TeacherProfileUpdate(BaseModel):
    department: Optional[str] = None
    position: Optional[str] = None
    office: Optional[str] = None


class TeacherProfileNested(BaseModel):
    id: int
    department: Optional[str] = None
    position: Optional[str] = None
    office: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Full profile responses (base + extension) ─────────────────────────────────

class UserProfileResponse(BaseModel):
    """Base profile — returned for any user."""
    id: int
    user_id: str
    class_id: Optional[int] = None
    full_name: Optional[str] = None
    bio: Optional[str] = None
    pfp: Optional[str] = None           # serialised from model `image` field
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        # remap model field `image` → schema field `pfp`
        instance = super().model_validate(obj, *args, **kwargs)
        if hasattr(obj, "image"):
            instance.pfp = obj.image
        return instance


class StudentProfileResponse(UserProfileResponse):
    """Full student profile — base profile + student extension."""
    student_profile: Optional[StudentProfileNested] = None


class TeacherProfileResponse(UserProfileResponse):
    """Full teacher profile — base profile + teacher extension."""
    teacher_profile: Optional[TeacherProfileNested] = None
    

# Parent profile response includes linked students

class ParentProfileResponse(BaseModel):
    id:              int
    profile_id:      int
    occupation:      Optional[str] = None
    relationship:    Optional[str] = None
    emergency_phone: Optional[str] = None
    created_at:      Optional[datetime] = None
    updated_at:      Optional[datetime] = None
 
    # Linked students
    students: List[StudentNested] = []
 
    model_config = {"from_attributes": True}
 
 
class ParentFullResponse(BaseModel):
    """Base profile fields + parent extension in one response."""
    id:         int
    user_id:    str
    class_id:   Optional[int] = None
    full_name:  Optional[str] = None
    bio:        Optional[str] = None
    image:      Optional[str] = None
    phone:      Optional[str] = None
    address:    Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
 
    parent_profile: Optional[ParentProfileResponse] = None
 
    model_config = {"from_attributes": True}