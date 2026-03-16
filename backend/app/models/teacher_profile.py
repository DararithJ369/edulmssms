from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class TeacherProfile(Base):
    __tablename__ = "teacher_profiles"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False, unique=True)

    department = Column(String, nullable=True)
    position = Column(String, nullable=True)            # e.g. "Senior Lecturer"
    office = Column(String, nullable=True)              # e.g. "Room 204, Block B"

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship back to parent UserProfile
    profile = relationship("UserProfile", back_populates="teacher_profile", lazy="selectin")
    
    # Note: Courses are accessed via the User's courses relationship (User → Course.teacher_id)