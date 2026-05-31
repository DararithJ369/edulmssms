from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)

    instructor_id = Column(String, ForeignKey("users.id"), nullable=False)

    name = Column(String, nullable=False, unique=True)
    code = Column(String, nullable=True)  # e.g. MTH101
    description = Column(Text, nullable=True)

    credits = Column(Integer, default=3)
    hours_per_week = Column(Integer, nullable=True)

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    instructor = relationship("User", back_populates="subjects", lazy="selectin")
    courses = relationship("Course", back_populates="subject", lazy="selectin")
    curriculums = relationship("Curriculum", back_populates="subject")

    @property
    def instructor_name(self) -> str:
        if self.instructor and self.instructor.profile:
            return self.instructor.profile.full_name or self.instructor.username
        return self.instructor.username if self.instructor else f"Faculty #{self.instructor_id[:8]}"