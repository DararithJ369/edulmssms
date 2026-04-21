from typing import Optional
from pydantic import BaseModel, EmailStr
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
    is_superuser: bool = False
    
    model_config = {"from_attributes": True}


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
