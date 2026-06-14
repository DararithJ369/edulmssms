from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SubjectBase(BaseModel):
    instructor_id: str
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    credits: Optional[int] = 3
    hours_per_week: Optional[int] = None
    is_active: Optional[bool] = True
    grade_id: Optional[int] = None


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    instructor_id: Optional[str] = None
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    credits: Optional[int] = None
    hours_per_week: Optional[int] = None
    is_active: Optional[bool] = None
    grade_id: Optional[int] = None


class SubjectResponse(SubjectBase):
    id: int
    created_at: datetime
    instructor_name: Optional[str] = None
    grade_name: Optional[str] = None

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        instance = super().model_validate(obj, *args, **kwargs)
        if hasattr(obj, "grade_level") and obj.grade_level:
            instance.grade_name = obj.grade_level.name
        return instance
    

class Subject(SubjectBase):
    id: int
    created_at: datetime
    instructor_name: Optional[str] = None
    grade_name: Optional[str] = None

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        instance = super().model_validate(obj, *args, **kwargs)
        if hasattr(obj, "grade_level") and obj.grade_level:
            instance.grade_name = obj.grade_level.name
        return instance