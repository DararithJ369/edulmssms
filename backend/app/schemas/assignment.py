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

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    attachment_file: Optional[str] = None
    

class AssignmentResponse(AssignmentBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class Assignment(AssignmentBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}