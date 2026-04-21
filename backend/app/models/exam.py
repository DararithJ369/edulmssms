from sqlalchemy import Column, Integer, String, Text, DateTime, Time, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base


class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)

    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)

    title = Column(String, nullable=False)
    description = Column(Text)

    exam_date = Column(DateTime, nullable=False)

    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    duration = Column(Integer, nullable=False)  # minutes

    total_marks = Column(Integer, default=100)
    pass_mark = Column(Integer, default=50)

    venue = Column(String)

    created_at = Column(DateTime(timezone=True), server_default=func.now())