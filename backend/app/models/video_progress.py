from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.base import Base

class StudentVideoProgress(Base):
    __tablename__ = "student_video_progress"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    current_time = Column(Float, nullable=False, default=0.0)  # in seconds
    duration = Column(Float, nullable=False, default=0.0)      # in seconds
    completed = Column(Boolean, nullable=False, default=False)  # sets true if >90% watched
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    student = relationship("User", lazy="selectin")
    lesson = relationship("Lesson", lazy="selectin")

    __table_args__ = (
        UniqueConstraint('student_id', 'lesson_id', name='_student_video_progress_uc'),
    )
