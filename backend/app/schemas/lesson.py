from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from app.schemas.lesson_material import LessonMaterialResponse
from app.schemas.quiz import QuizResponse
from app.schemas.assignment import AssignmentResponse


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
    
    # 🛠️ FIXED: Added relational structural database ID fields to payload tracking signatures
    module_id: int
    course_id: Optional[int] = None 
    
    module_name: Optional[str] = None
    course_name: Optional[str] = None

    materials: List[LessonMaterialResponse] = []
    quizzes: List[QuizResponse] = []
    assignments: List[AssignmentResponse] = []

    model_config = {"from_attributes": True}
    
    
class Lesson(LessonBase):
    id: int
    module_id: int
    course_id: Optional[int] = None
    updated_at: Optional[datetime]
    module_name: Optional[str] = None
    course_name: Optional[str] = None
    
    materials: List[LessonMaterialResponse] = []
    quizzes: List[QuizResponse] = []
    assignments: List[AssignmentResponse] = []

    model_config = {"from_attributes": True}