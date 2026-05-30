from pydantic import BaseModel
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

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    attachment_file: Optional[str] = None
    lesson_id: Optional[int] = None
    

class AssignmentResponse(AssignmentBase):
    id: int
    created_at: datetime
    course_name: Optional[str] = None
    teacher_name: Optional[str] = None

    model_config = {"from_attributes": True}


class Assignment(AssignmentBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    course_name: Optional[str] = None
    teacher_name: Optional[str] = None

    model_config = {"from_attributes": True}