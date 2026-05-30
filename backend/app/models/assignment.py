from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    
    module_name = Column(String, nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    due_date = Column(DateTime, nullable=False)
    attachment_file = Column(String, nullable=True)
    
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=True)
    teacher_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    course = relationship("Course", back_populates="assignments", lazy="selectin", overlaps="assignments")
    lesson = relationship("Lesson", lazy="selectin")
    teacher = relationship("User", foreign_keys=[teacher_id], lazy="selectin")

    @property
    def course_name(self) -> str:
        return self.course.course_name if self.course else f"Course #{self.course_id}"

    @property
    def teacher_name(self) -> str:
        if self.teacher and self.teacher.profile:
            return self.teacher.profile.full_name or self.teacher.username
        return self.teacher.username if self.teacher else f"Teacher #{self.teacher_id}"