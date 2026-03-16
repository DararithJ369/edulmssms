from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class EnrollmentBase(BaseModel):
    progress: float = 0.0
    status: str = "Active"  # Active, Completed, Dropped
    

class EnrollmentCreate(EnrollmentBase):
    course_id: int
    student_id: str
    
    
class EnrollmentUpdate(BaseModel):
    progress: Optional[float] = None
    status: Optional[str] = None
    

class EnrollmentResponse(EnrollmentBase):
    id: int
    course_id: int
    student_id: str
    enrollment_date: datetime
    
    model_config = {"from_attributes": True}
    

class Enrollment(EnrollmentBase):
    id: int
    course_id: int
    student_id: str
    enrollment_date: datetime
    
    model_config = {"from_attributes": True}