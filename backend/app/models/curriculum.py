from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Curriculum(Base):
    __tablename__ = "curriculums"

    id = Column(Integer, primary_key=True)

    grade_level_id = Column(Integer, ForeignKey("grade_levels.id"), nullable=False)
    subject_id     = Column(Integer, ForeignKey("subjects.id"), nullable=False)

    # Optional (VERY USEFUL)
    is_core        = Column(Boolean, default=True)
    hours_per_week = Column(Integer, nullable=True)

    # Relationships
    grade_level = relationship("GradeLevel", back_populates="curriculums")
    subject     = relationship("Subject", back_populates="curriculums")