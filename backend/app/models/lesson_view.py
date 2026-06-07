from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.base import Base

class StudentLessonView(Base):
    __tablename__ = "student_lesson_views"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    viewed_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    student = relationship("User", lazy="selectin")
    lesson = relationship("Lesson", lazy="selectin")

    __table_args__ = (
        UniqueConstraint('student_id', 'lesson_id', name='_student_lesson_view_uc'),
    )
