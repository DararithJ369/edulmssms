from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base


class Result(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(String, ForeignKey("users.id"), nullable=False)

    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=True)

    graded_by = Column(String, ForeignKey("users.id"), nullable=False)

    score = Column(Integer, nullable=False)
    total_marks = Column(Integer, nullable=False)

    percentage = Column(Float)

    grade = Column(String)  # A, B, C, etc.

    feedback = Column(Text)

    is_passed = Column(Boolean, default=False)

    graded_at = Column(DateTime(timezone=True), server_default=func.now())