from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class AnnouncementBase(BaseModel):
    title: str
    message: str
    type: str  # general, course-specific, etc.
    
    class Config:
        orm_mode = True
        
        
class AnnouncementCreate(AnnouncementBase):
    recipient_id: Optional[str] = None  # e.g., course_id for course-specific announcements
    sender_id: Optional[str] = None
    course_id: Optional[int] = None
    
    
class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    type: Optional[str] = None  # general, course-specific, etc.
    recipient_id: Optional[str] = None  # e.g., course_id for course-specific announcements
    sender_id: Optional[str] = None
    course_id: Optional[int] = None
    is_read: Optional[bool] = None
    

class AnnouncementResponse(AnnouncementBase):
    id: int
    recipient_id: Optional[str] = None  # e.g., course_id for course-specific announcements
    sender_id: Optional[str] = None
    course_id: Optional[int] = None
    is_read: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}

    
class Announcement(AnnouncementBase):
    id: int
    recipient_id: Optional[str] = None  # e.g., course_id for course-specific announcements
    sender_id: Optional[str] = None
    course_id: Optional[int] = None
    is_read: bool = False
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}