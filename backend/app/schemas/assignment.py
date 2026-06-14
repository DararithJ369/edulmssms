from pydantic import BaseModel, field_serializer
from datetime import datetime
from typing import Optional

# Base
class AssignmentBase(BaseModel):
    course_id: int
    module_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    due_date: datetime
    attachment_file: Optional[str] = None
    teacher_id: str
    lesson_id: Optional[int] = None

class AssignmentCreate(BaseModel):
    course_id: Optional[int] = None
    module_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    due_date: datetime
    attachment_file: Optional[str] = None
    teacher_id: Optional[str] = None
    lesson_id: Optional[int] = None

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    attachment_file: Optional[str] = None
    lesson_id: Optional[int] = None
    course_id: Optional[int] = None
    

class AssignmentResponse(AssignmentBase):
    id: int
    created_at: datetime
    course_name: Optional[str] = None
    teacher_name: Optional[str] = None

    model_config = {"from_attributes": True}

    @field_serializer("attachment_file")
    def serialize_attachment_file(self, v: Optional[str]) -> Optional[str]:
        from app.services.storage import StorageService
        return StorageService.resolve_url(v)


class Assignment(AssignmentBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    course_name: Optional[str] = None
    teacher_name: Optional[str] = None

    model_config = {"from_attributes": True}