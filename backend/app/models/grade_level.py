from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class GradeLevel(Base):
    __tablename__ = "grade_levels"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, nullable=False, unique=True)  # e.g. "Grade 1", "Year 10"
    code        = Column(String, nullable=True, unique=True)   # e.g. "G1", "Y10"
    description = Column(String, nullable=True)
    order       = Column(Integer, nullable=False, default=0)   # for sorting G1 < G2 < G3...
    is_active   = Column(Boolean, default=True, nullable=False)

    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    enrollments = relationship("Enrollment", back_populates="grade_level", lazy="selectin")
    student_profiles = relationship("StudentProfile", back_populates="grade_level", lazy="selectin")
    curriculums = relationship("Curriculum", back_populates="grade_level")