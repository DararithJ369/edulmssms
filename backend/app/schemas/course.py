from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class CourseBase(BaseModel):
    course_name: str
    course_code: str
    description: Optional[str] = None
    category: Optional[str] = None
    duration: Optional[int] = None  # in weeks
    price: Optional[float] = None
    max_students: Optional[int] = None
    difficulty: Optional[str] = "beginner"
    instructor_name: Optional[str] = None
    is_published: Optional[bool] = None
    

class CourseCreate(CourseBase):
    instructor_id: str
    
    
class CourseUpdate(BaseModel):
    course_name: Optional[str] = None
    course_code: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    duration: Optional[int] = None
    price: Optional[float] = None
    max_students: Optional[int] = None
    difficulty: Optional[str] = None
    instructor_name: Optional[str] = None
    is_published: Optional[bool] = None
    
    
class CourseResponse(CourseBase):
    id: int
    instructor_id: str
    subject_id: Optional[int] = None
    thumbnail: Optional[str] = None
    enrollment_status: str = "open" # open, closed, waitlist
    student_enrolled: int = 0    
    has_modules: bool = False
    has_quizzes: bool = False
    certificate_offered: bool = False
    certificate_title: Optional[str] = None
    certificate_description: Optional[str] = None
    is_published: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
    

class Course(CourseBase):
    id: int
    instructor_id: str
    thumbnail: Optional[str] = None
    enrollment_status: str = "open" # open, closed, waitlist
    student_enrolled: int = 0    
    has_modules: bool = False
    has_quizzes: bool = False
    certificate_offered: bool = False
    certificate_title: Optional[str] = None
    certificate_description: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime]
    
    model_config = {"from_attributes": True}