from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ResultBase(BaseModel):
    student_id: str
    assignment_id: Optional[int] = None
    exam_id: Optional[int] = None
    quiz_id: Optional[int] = None
    graded_by: str
    score: int
    total_marks: int
    grade: Optional[str] = None
    feedback: Optional[str] = None
    is_passed: Optional[bool] = False


class ResultCreate(ResultBase):
    pass


class ResultUpdate(BaseModel):
    score: Optional[int] = None
    total_marks: Optional[int] = None
    grade: Optional[str] = None
    feedback: Optional[str] = None
    is_passed: Optional[bool] = None
    
    
class ResultResponse(ResultBase):
    id: int
    percentage: Optional[float]
    graded_at: datetime
    student_name: Optional[str] = None
    grader_name: Optional[str] = None
    assessment_title: Optional[str] = None

    model_config = {"from_attributes": True}


class Result(ResultBase):
    id: int
    percentage: Optional[float]
    graded_at: datetime
    student_name: Optional[str] = None
    grader_name: Optional[str] = None
    assessment_title: Optional[str] = None

    model_config = {"from_attributes": True}