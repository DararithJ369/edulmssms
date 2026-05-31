from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class ClassBase(BaseModel):
    grade_id: int
    supervisor_id: str
    name: str
    section: Optional[str] = None
    room: Optional[str] = None
    capacity: Optional[int] = 30
    academic_year: str
    is_active: Optional[bool] = True


class ClassCreate(ClassBase):
    pass


class ClassUpdate(BaseModel):
    name: Optional[str] = None
    section: Optional[str] = None
    room: Optional[str] = None
    capacity: Optional[int] = None
    is_active: Optional[bool] = None
    

class ClassResponse(ClassBase):
    id: int
    created_at: datetime
    supervisor_name: Optional[str] = None
    
    model_config = {"from_attributes": True}
    

class Class(ClassBase):
    id: int
    created_at: datetime
    supervisor_name: Optional[str] = None
    
    model_config = {"from_attributes": True}
