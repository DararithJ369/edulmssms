from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class LessonMaterialBase(BaseModel):
    lesson_id: int
    uploaded_by: str
    title: str
    description: Optional[str] = None
    file_url: Optional[str] = None  
    type: str
    external_url: Optional[str] = None
    file_size: Optional[int] = None
    is_visible: Optional[bool] = True


class LessonMaterialCreate(LessonMaterialBase):
    pass


class LessonMaterialUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    file_url: Optional[str] = None
    external_url: Optional[str] = None 
    type: Optional[str] = None
    file_size: Optional[int] = None
    is_visible: Optional[bool] = None
    
    
class LessonMaterialResponse(LessonMaterialBase):
    id: int
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class LessonMaterial(LessonMaterialBase):
    id: int
    uploaded_at: datetime

    model_config = {"from_attributes": True}