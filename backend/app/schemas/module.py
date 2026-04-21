from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class ModuleBase(BaseModel):
    title: str
    description: Optional[str] = None
    course_id: int
    

class ModuleCreate(ModuleBase):
    course_id: int
    

class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    course_id: Optional[int] = None
    
    
class ModuleResponse(ModuleBase):   
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
    

class Module(ModuleBase):
    id: int
    course_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    model_config = {"from_attributes": True}
    