from typing import Optional, List
from pydantic import BaseModel, EmailStr, field_serializer
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    username: str
    role_id: int
    image: Optional[str] = None
    is_active: bool = True
        

class UserCreate(UserBase):
    password: str


class UserSignup(BaseModel):
    email: EmailStr
    username: str
    password: str
    
    
class UserUpdate(UserBase):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: Optional[str] = None
    role_id: Optional[int] = None
    image: Optional[str] = None
    is_active: Optional[bool] = None
    

class User(UserBase):
    id: str
    is_superuser: bool = False
    created_at: datetime
    updated_at: Optional[datetime]


class RoleNested(BaseModel):
    id: int
    name: str
    
    model_config = {"from_attributes": True}
    
class UserResponse(UserBase):
    id: str
    email: EmailStr
    username: str
    role_id: int
    role: RoleNested
    image: Optional[str] = None
    profile_image: Optional[str] = None   # from UserProfile.image
    is_superuser: bool = False
    student_profile_id: Optional[int] = None
    
    model_config = {"from_attributes": True}

    @field_serializer("image", "profile_image")
    def serialize_urls(self, v: Optional[str]) -> Optional[str]:
        from app.services.storage import StorageService
        return StorageService.resolve_url(v)


class DeviceInfo(BaseModel):
    device: Optional[str] = None
    os: Optional[str] = None
    browser: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserLogInResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    info: DeviceInfo


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserListResponse(BaseModel):
    items: list[User]
    total: int
    page: int
    page_size: int
    total_pages: int
    

class UserProfileBase(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    pfp: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tier: Optional[str] = None
    

class UserProfile(UserProfileBase):
    id: str
    user_id: str
    
    model_config = {"from_attributes": True}
        
        
class InstructorProfile(UserProfileBase):
    department: Optional[str] = None
    position: Optional[str] = None
    office: Optional[str] = None
    
    
class StudentProfile(UserProfileBase):
    enrolment_date: Optional[datetime] = None
    student_id: Optional[str] = None


class ParentProfileBase(BaseModel):
    occupation: Optional[str] = None
    parent_relationship: Optional[str] = None
    emergency_phone: Optional[str] = None


class ParentProfileCreate(ParentProfileBase):
    profile_id: int


class ParentProfileUpdate(BaseModel):
    occupation: Optional[str] = None
    parent_relationship: Optional[str] = None
    emergency_phone: Optional[str] = None


class ParentProfileResponse(ParentProfileBase):
    id: int
    profile_id: int
    
    model_config = {"from_attributes": True}


class ParentFullResponse(ParentProfileResponse):
    profile: Optional[UserProfile] = None
    
    model_config = {"from_attributes": True}
    
    
# ── Base ──────────────────────────────────────────────────────────────────────

class UserProfileBase(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    pfp: Optional[str] = None           # maps to `image` column in model
    phone: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[str] = None  # ISO format: YYYY-MM-DD
    gender: Optional[str] = None        # M, F, Other, Prefer not to say
    national_id: Optional[str] = None   # Passport, ID card, etc.
    nationality: Optional[str] = None   # Country/Nationality
    website: Optional[str] = None       # Portfolio or personal website
    linkedin: Optional[str] = None      # LinkedIn profile URL
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    blood_type: Optional[str] = None
    medical_conditions: Optional[str] = None
    tier: Optional[str] = None


# ── Student extension ─────────────────────────────────────────────────────────

class StudentProfileCreate(BaseModel):
    student_id: Optional[str] = None
    enrolment_date: Optional[datetime] = None
    previous_school: Optional[str] = None
    scholarship_status: Optional[str] = None
    special_needs: Optional[str] = None


class StudentProfileUpdate(BaseModel):
    student_id: Optional[str] = None
    enrolment_date: Optional[datetime] = None
    previous_school: Optional[str] = None
    scholarship_status: Optional[str] = None
    special_needs: Optional[str] = None


class ParentProfileBasicProfile(BaseModel):
    """Minimal profile info for parent display."""
    user_id: Optional[str] = None
    
    model_config = {"from_attributes": True}


class ParentProfileBasic(BaseModel):
    """Basic parent info for display in student profiles."""
    id: int
    occupation: Optional[str] = None
    parent_relationship: Optional[str] = None
    emergency_phone: Optional[str] = None
    # Include full_name from profile
    full_name: Optional[str] = None
    profile: Optional[ParentProfileBasicProfile] = None

    model_config = {"from_attributes": True}
    
    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        # Get full_name and user_id from related profile if available
        instance = super().model_validate(obj, *args, **kwargs)
        if hasattr(obj, "profile") and obj.profile:
            instance.full_name = getattr(obj.profile, "full_name", None)
            instance.profile = ParentProfileBasicProfile(user_id=obj.profile.user_id)
        return instance


class StudentProfileNested(BaseModel):
    id: int
    student_id: Optional[str] = None
    department: Optional[str] = None
    enrolment_date: Optional[datetime] = None
    grade_level_id: Optional[int] = None
    grade_level_name: Optional[str] = None  # e.g. "Year 1", "Year 2"
    previous_school: Optional[str] = None
    scholarship_status: Optional[str] = None
    special_needs: Optional[str] = None
    parents: Optional[List['ParentProfileBasic']] = []
    class_id: Optional[int] = None

    model_config = {"from_attributes": True}


# ── Parent extension ─────────────────────────────────────────────────────────

class StudentNested(BaseModel):
    id: int
    student_id: Optional[str] = None
    department: Optional[str] = None
    enrolment_date: Optional[datetime] = None
    grade_level_id: Optional[int] = None
    grade_level_name: Optional[str] = None
    full_name: Optional[str] = None
    profile: Optional[ParentProfileBasicProfile] = None  # reuse minimal profile schema with user_id
 
    model_config = {"from_attributes": True}
    
    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        # Get full_name and user_id from related profile if available
        instance = super().model_validate(obj, *args, **kwargs)
        if hasattr(obj, "profile") and obj.profile:
            instance.full_name = getattr(obj.profile, "full_name", None)
            instance.profile = ParentProfileBasicProfile(user_id=obj.profile.user_id)
        
        # Extract grade level name
        if hasattr(obj, "grade_level") and obj.grade_level:
            instance.grade_level_name = obj.grade_level.name
        
        return instance


class ParentProfileCreate(BaseModel):
    occupation:      Optional[str] = None
    relationship:    Optional[str] = None   # "Father" | "Mother" | "Guardian"
    emergency_phone: Optional[str] = None
 
 
class ParentProfileUpdate(BaseModel):
    occupation:      Optional[str] = None
    relationship:    Optional[str] = None
    emergency_phone: Optional[str] = None


# ── Instructor extension ────────────────────────────────────────────────────────

class InstructorProfileCreate(BaseModel):
    department: Optional[str] = None
    position: Optional[str] = None
    office: Optional[str] = None
    hire_date: Optional[str] = None


class InstructorProfileUpdate(BaseModel):
    department: Optional[str] = None
    position: Optional[str] = None
    office: Optional[str] = None
    hire_date: Optional[str] = None


class InstructorProfileNested(BaseModel):
    id: int
    department: Optional[str] = None
    position: Optional[str] = None
    office: Optional[str] = None
    hire_date: Optional[str] = None

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
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    national_id: Optional[str] = None
    nationality: Optional[str] = None
    website: Optional[str] = None
    linkedin: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    blood_type: Optional[str] = None
    medical_conditions: Optional[str] = None
    tier: Optional[str] = "free"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

    @field_serializer("pfp")
    def serialize_pfp(self, v: Optional[str]) -> Optional[str]:
        from app.services.storage import StorageService
        return StorageService.resolve_url(v)

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
    
    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        # Call parent's model_validate first
        instance = super().model_validate(obj, *args, **kwargs)
        
        # Handle student profile nested object
        if instance.student_profile and hasattr(obj, "student_profile") and obj.student_profile:
            # Extract grade level name from the relationship
            if hasattr(obj.student_profile, "grade_level") and obj.student_profile.grade_level:
                instance.student_profile.grade_level_name = obj.student_profile.grade_level.name
            
            # Handle parent validation for nested parents
            if hasattr(obj.student_profile, "parents") and obj.student_profile.parents:
                parents = []
                for parent_obj in obj.student_profile.parents:
                    parent_validated = ParentProfileBasic.model_validate(parent_obj)
                    parents.append(parent_validated)
                instance.student_profile.parents = parents
        
        return instance


class InstructorProfileResponse(UserProfileResponse):
    """Full instructor profile — base profile + instructor extension."""
    instructor_profile: Optional[InstructorProfileNested] = None
    

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
    
    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        # Call parent's model_validate first
        instance = super().model_validate(obj, *args, **kwargs)
        
        # Map parent_relationship from model to relationship in schema
        if hasattr(obj, "parent_relationship"):
            instance.relationship = obj.parent_relationship
        
        # Handle student validation for nested students
        if hasattr(obj, "students") and obj.students:
            students = []
            for student_obj in obj.students:
                student_validated = StudentNested.model_validate(student_obj)
                students.append(student_validated)
            instance.students = students
        
        return instance
 
 
class ParentFullResponse(BaseModel):
    """Base profile fields + parent extension in one response."""
    id:         int
    user_id:    str
    class_id:   Optional[int] = None
    full_name:  Optional[str] = None
    bio:        Optional[str] = None
    pfp:        Optional[str] = None           # serialised from model `image` field
    phone:      Optional[str] = None
    address:    Optional[str] = None
    date_of_birth: Optional[str] = None
    gender:     Optional[str] = None
    national_id: Optional[str] = None
    website:    Optional[str] = None
    linkedin:   Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
 
    parent_profile: Optional[ParentProfileResponse] = None
 
    model_config = {"from_attributes": True}

    @field_serializer("pfp")
    def serialize_pfp(self, v: Optional[str]) -> Optional[str]:
        from app.services.storage import StorageService
        return StorageService.resolve_url(v)
    
    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        # Call parent's model_validate first
        instance = super().model_validate(obj, *args, **kwargs)
        
        # Remap model field `image` → schema field `pfp`
        if hasattr(obj, "image"):
            instance.pfp = obj.image
        
        # Handle parent profile validation
        if hasattr(obj, "parent_profile") and obj.parent_profile:
            parent_validated = ParentProfileResponse.model_validate(obj.parent_profile)
            instance.parent_profile = parent_validated
        
        return instance


class PhoneUpdateRequest(BaseModel):
    current_phone: Optional[str] = None
    new_phone: str


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str
