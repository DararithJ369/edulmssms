from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SubjectBase(BaseModel):
    instructor_id: str
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    credits: Optional[int] = 3
    hours_per_week: Optional[int] = None
    is_active: Optional[bool] = True


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    instructor_id: Optional[str] = None
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    credits: Optional[int] = None
    hours_per_week: Optional[int] = None
    is_active: Optional[bool] = None


class SubjectResponse(SubjectBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
    

class Subject(SubjectBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}