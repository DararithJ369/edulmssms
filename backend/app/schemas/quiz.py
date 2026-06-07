from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class QuizOptionCreate(BaseModel):
    option_text: str
    is_correct: int = 0  # 1 for correct, 0 for incorrect


class QuizQuestionCreate(BaseModel):
    question_text: str
    question_type: Optional[str] = "multiple_choice"
    options: List[QuizOptionCreate] = []


class QuizBase(BaseModel):
    course_id: int
    module_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    due_date: datetime
    instructor_id: str
    lesson_id: Optional[int] = None

class QuizCreate(QuizBase):
    questions: Optional[List[QuizQuestionCreate]] = None

class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    lesson_id: Optional[int] = None
    
    
class QuizOptionResponse(BaseModel):
    id: int
    question_id: int
    option_text: str

    model_config = {"from_attributes": True}


class QuizQuestionResponse(BaseModel):
    id: int
    quiz_id: int
    question_text: str
    question_type: Optional[str] = "multiple_choice"
    options: list[QuizOptionResponse] = []

    model_config = {"from_attributes": True}


class QuizResponse(QuizBase):
    id: int
    created_at: datetime
    course_name: Optional[str] = None
    lesson_title: Optional[str] = None
    questions: Optional[list[QuizQuestionResponse]] = None

    model_config = {"from_attributes": True}
    

class Quiz(QuizBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    course_name: Optional[str] = None
    lesson_title: Optional[str] = None
    questions: Optional[list[QuizQuestionResponse]] = None

    model_config = {"from_attributes": True}

    
    
class QuizSubmitPayload(BaseModel):
    answers: dict[int, int]  # question_id -> option_id 
    
    
class QuizQuestion(BaseModel):
    id: int
    quiz_id: int
    question_text: str
    options: Optional[list] = None
    
    model_config = {"from_attributes": True}
 
   
class QuizOption(BaseModel):
    id: int
    question_id: int
    option_text: str
    is_correct: bool
    
    model_config = {"from_attributes": True}