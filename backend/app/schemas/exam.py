from pydantic import BaseModel
from datetime import datetime, time
from typing import Optional


class ExamBase(BaseModel):
    lesson_id: int
    created_by: str
    title: str
    description: Optional[str] = None

    exam_date: datetime
    start_time: time
    end_time: time

    duration: int
    total_marks: Optional[int] = 100
    pass_mark: Optional[int] = 50
    venue: Optional[str] = None


class ExamCreate(ExamBase):
    pass


class ExamUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    exam_date: Optional[datetime] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    duration: Optional[int] = None
    total_marks: Optional[int] = None
    pass_mark: Optional[int] = None
    venue: Optional[str] = None
    
    
class ExamResponse(ExamBase):   
    id: int
    created_at: datetime
    lesson_title: Optional[str] = None
    course_name: Optional[str] = None

    model_config = {"from_attributes": True}
    
    
class ExamSubmitPayload(BaseModel):
    answers: dict[int, int]  # question_id -> option_id


class Exam(ExamBase):
    id: int
    created_at: datetime
    lesson_title: Optional[str] = None
    course_name: Optional[str] = None

    model_config = {"from_attributes": True}