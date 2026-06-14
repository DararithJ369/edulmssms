from typing import Optional, List
from pydantic import BaseModel, field_serializer
from datetime import datetime


# ── Lesson Schemas ───────────────────────────────────────────────────────────

class LessonCreate(BaseModel):
    title: str
    description: Optional[str] = None
    content: Optional[str] = None
    duration: str = "0min"
    material_type: str = "article"
    material_url: Optional[str] = None
    material_file: Optional[str] = None
    order: int

class LessonResponse(BaseModel):
    id: int
    module_id: int
    title: str
    description: Optional[str] = None
    content: Optional[str] = None
    duration: str
    material_type: str
    material_url: Optional[str] = None
    material_file: Optional[str] = None
    order: int
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_serializer("material_file")
    def serialize_material_file(self, v: Optional[str]) -> Optional[str]:
        from app.services.storage import StorageService
        return StorageService.resolve_url(v)


# ── Module Schemas ───────────────────────────────────────────────────────────

class ModuleCreate(BaseModel):
    title: str
    description: Optional[str] = None
    order: int
    lessons: List[LessonCreate] = []  # Receives nested frontend lessons array

class ModuleResponse(BaseModel):
    id: int
    course_id: int
    title: str
    description: Optional[str] = None
    order: int
    created_at: datetime
    lessons: List[LessonResponse] = []

    model_config = {"from_attributes": True}


# ── Course Schemas ───────────────────────────────────────────────────────────

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
    subject_id: Optional[int] = None
    thumbnail: Optional[str] = None


class CourseCreate(CourseBase):
    instructor_id: Optional[str] = None  # Can arrive empty on testing workflows
    modules: List[ModuleCreate] = []     # Accepts the nested front-end layout arrays


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
    instructor_id: Optional[str] = None
    is_published: Optional[bool] = None
    subject_id: Optional[int] = None
    thumbnail: Optional[str] = None
    
    
class CourseResponse(CourseBase):
    id: int
    instructor_id: Optional[str] = None  # 🚀 FIXED: Clears your validation crash on missing IDs!
    thumbnail: Optional[str] = None
    enrollment_status: str = "open"  # open, closed, waitlist
    student_enrolled: int = 0    
    has_modules: bool = False
    has_quizzes: bool = False
    certificate_offered: bool = False
    certificate_title: Optional[str] = None
    certificate_description: Optional[str] = None
    is_published: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None
    modules: List[ModuleResponse] = []  # Maps child module objects down into UI lists

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        instance = super().model_validate(obj, *args, **kwargs)
        if hasattr(obj, "enrollments") and obj.enrollments:
            instance.student_enrolled = sum(1 for e in obj.enrollments if e.is_active)
        else:
            instance.student_enrolled = 0
        return instance

    @field_serializer("thumbnail")
    def serialize_thumbnail(self, v: Optional[str]) -> Optional[str]:
        from app.services.storage import StorageService
        return StorageService.resolve_url(v)