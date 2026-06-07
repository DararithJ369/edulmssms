from datetime import time as TimeType, datetime
from typing import Optional
from pydantic import BaseModel


class ScheduleSlotBase(BaseModel):
    class_id: int
    teacher_id: str
    subject_id: int
    day_of_week: str  # e.g., "MONDAY", "TUESDAY", etc.
    start_time: TimeType
    end_time: TimeType
    room: Optional[str] = None
    is_active: Optional[bool] = True


class ScheduleSlotCreate(ScheduleSlotBase):
    pass


class ScheduleSlotUpdate(BaseModel):
    class_id: Optional[int] = None
    teacher_id: Optional[str] = None
    subject_id: Optional[int] = None
    day_of_week: Optional[str] = None
    start_time: Optional[TimeType] = None
    end_time: Optional[TimeType] = None
    room: Optional[str] = None
    is_active: Optional[bool] = None


class ScheduleSlotResponse(ScheduleSlotBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    class_name: Optional[str] = None
    teacher_name: Optional[str] = None
    subject_name: Optional[str] = None

    model_config = {"from_attributes": True}
