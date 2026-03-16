from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False, unique=True)

    student_id = Column(String, nullable=True)          # e.g. student number "STU2024001"
    enrolment_date = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship back to parent UserProfile
    profile = relationship("UserProfile", back_populates="student_profile", lazy="selectin")
    
    # Relationship to parent profiles (via association table parent_student)
    parents = relationship(
        "ParentProfile",
        secondary="parent_student",
        back_populates="students",
        lazy="selectin",
    )