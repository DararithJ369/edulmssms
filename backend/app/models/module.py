# from typing import Optional
# from pydantic import BaseModel
# from datetime import datetime


# class ModuleBase(BaseModel):
#     title: str
#     description: Optional[str] = None
#     course_id: int
    

# class ModuleCreate(ModuleBase):
#     course_id: int
    

# class ModuleUpdate(BaseModel):
#     title: Optional[str] = None
#     description: Optional[str] = None
#     course_id: Optional[int] = None
    
    
# class ModuleResponse(ModuleBase):   
#     id: int
#     created_at: datetime

#     model_config = {"from_attributes": True}
    

# class Module(ModuleBase):
#     id: int
#     course_id: int
#     created_at: datetime
#     updated_at: Optional[datetime]
    
#     model_config = {"from_attributes": True}

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.base import Base


class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    lessons = relationship("Lesson", backref="module", cascade="all, delete-orphan")    
    