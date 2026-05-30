from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base



class Result(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(String, ForeignKey("users.id"), nullable=False)

    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=True)

    graded_by = Column(String, ForeignKey("users.id"), nullable=False)

    score = Column(Integer, nullable=False)
    total_marks = Column(Integer, nullable=False)

    percentage = Column(Float)

    grade = Column(String)  # A, B, C, etc.

    feedback = Column(Text)

    is_passed = Column(Boolean, default=False)

    graded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    student = relationship("User", foreign_keys=[student_id], lazy="selectin")
    assignment = relationship("Assignment", foreign_keys=[assignment_id], lazy="selectin")
    exam = relationship("Exam", foreign_keys=[exam_id], lazy="selectin")
    quiz = relationship("Quiz", foreign_keys=[quiz_id], lazy="selectin")

    @property
    def student_name(self) -> str:
        if self.student and self.student.profile:
            return self.student.profile.full_name or self.student.username
        return self.student.username if self.student else f"Student #{self.student_id}"

    @property
    def assessment_title(self) -> str:
        if self.exam:
            return self.exam.title
        elif self.assignment:
            return self.assignment.title
        elif self.quiz:
            return self.quiz.title
        return f"Assessment"