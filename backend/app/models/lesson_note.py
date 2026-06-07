from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.base import Base

class StudentLessonNote(Base):
    __tablename__ = "student_lesson_notes"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(Float, nullable=False)  # seconds offset in video
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", lazy="selectin")
    lesson = relationship("Lesson", lazy="selectin")
