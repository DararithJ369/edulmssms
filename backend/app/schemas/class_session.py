from datetime import date as DateType, time as TimeType, datetime
from typing import Optional
from pydantic import BaseModel

class ClassSessionBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: DateType
    start_time: TimeType
    end_time: TimeType
    room: Optional[str] = None
    status: Optional[str] = "scheduled"
    subject_id: int
    teacher_id: str
    schedule_slot_id: Optional[int] = None


class ClassSessionCreate(ClassSessionBase):
    pass


class ClassSessionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[DateType] = None
    start_time: Optional[TimeType] = None
    end_time: Optional[TimeType] = None
    room: Optional[str] = None
    status: Optional[str] = None
    subject_id: Optional[int] = None
    teacher_id: Optional[str] = None
    schedule_slot_id: Optional[int] = None
    
    
class ClassSessionResponse(ClassSessionBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ClassSession(ClassSessionBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}