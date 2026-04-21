from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class LessonBase(BaseModel):
    title: str
    content: Optional[str] = None
    duration: Optional[str] = None  # Duration as string (e.g., "45min")
    material_type: Optional[str] = None  # video, text, quiz, etc.
    material_url: Optional[str] = None
    material_file: Optional[str] = None  # file path or URL to the material
    order: int  # order of the lesson within the module
    

class LessonCreate(LessonBase):
    module_id: int

    
class LessonUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    duration: Optional[str] = None
    material_type: Optional[str] = None
    material_url: Optional[str] = None
    material_file: Optional[str] = None
    order: Optional[int] = None
    module_id: Optional[int] = None
    
    
class LessonResponse(LessonBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
    
    
class Lesson(LessonBase):
    id: int
    module_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    model_config = {"from_attributes": True}