from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


class StudentLessonProgressResponse(BaseModel):
    id: int
    student_id: str
    lesson_id: int
    completed: bool
    completed_at: datetime

    model_config = {"from_attributes": True}


class StudentModuleProgressResponse(BaseModel):
    id: int
    student_id: str
    module_id: int
    completed: bool
    completed_at: datetime

    model_config = {"from_attributes": True}


class StudentCourseProgressResponse(BaseModel):
    id: int
    student_id: str
    course_id: int
    progress_percentage: float
    completed_lessons: int
    completed_modules: int
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ToggleProgressRequest(BaseModel):
    completed: bool


class CourseProgressAggregate(BaseModel):
    course_id: int
    progress_percentage: float
    completed_lessons_count: int
    total_lessons_count: int
    completed_modules_count: int
    total_modules_count: int
    completed_lesson_ids: List[int]
    completed_module_ids: List[int]
