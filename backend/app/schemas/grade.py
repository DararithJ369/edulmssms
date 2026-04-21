from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class GradeBase(BaseModel):
    name: str
    level: int
    description: Optional[str] = None


class GradeCreate(GradeBase):
    pass


class GradeUpdate(BaseModel):
    name: Optional[str] = None
    level: Optional[int] = None
    description: Optional[str] = None


class GradeResponse(GradeBase):
    id: int
    created_at: datetime
    
    model_config = {"from_attributes": True}
    

class Grade(GradeBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}