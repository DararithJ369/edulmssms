from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime, date


class attendanceBase(BaseModel):
    student_id: str
    course_id: int
    date: date
    status: str # present, absent, late
    time: Optional[str] = None # e.g. "09:00 AM"
    note: Optional[str] = None
    

class AttendanceCreate(attendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    status: Optional[str] = None
    time: Optional[str] = None
    note: Optional[str] = None
    
    
class AttendanceResponse(attendanceBase):
    id: int
    recorded_by: str # teacher_id
    created_at: datetime
    
    model_config = {"from_attributes": True}
    
    
class Attendance(BaseModel):
    id: int
    student_id: str
    course_id: int
    date: date
    status: str # present, absent, late
    time: Optional[str] = None # e.g. "09:00 AM"
    note: Optional[str] = None
    recorded_by: str # teacher_id
    created_at: datetime
    
    model_config = {"from_attributes": True}
        

class AttendanceBulkCreate(BaseModel):
    course_id: int
    date: date
    records: List[dict] # list of {student_id, status, time, note}