from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Result(Base):
    __tablename__ = "results"
    __table_args__ = (
        UniqueConstraint('student_id', 'quiz_id', name='uq_result_student_quiz'),
        UniqueConstraint('student_id', 'assignment_id', name='uq_result_student_assignment'),
    )

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

    # Database level protection blocking cross-user race conditions or multi-row duplicates per evaluation item
    __table_args__ = (
        UniqueConstraint('student_id', 'quiz_id', name='uq_result_student_quiz'),
        UniqueConstraint('student_id', 'assignment_id', name='uq_result_student_assignment'),
        UniqueConstraint('student_id', 'exam_id', name='uq_result_student_exam'),
    )

    # Relationships
    student = relationship("User", foreign_keys=[student_id], lazy="selectin")
    assignment = relationship("Assignment", foreign_keys=[assignment_id], lazy="selectin")
    exam = relationship("Exam", foreign_keys=[exam_id], lazy="selectin")
    quiz = relationship("Quiz", foreign_keys=[quiz_id], lazy="selectin")
    grader = relationship("User", foreign_keys=[graded_by], lazy="selectin")

    @property
    def student_name(self) -> str:
        if self.student and self.student.profile:
            return self.student.profile.full_name or self.student.username
        return self.student.username if self.student else f"Student #{self.student_id}"

    @property
    def grader_name(self) -> str:
        if self.grader and self.grader.profile:
            return self.grader.profile.full_name or self.grader.username
        return self.grader.username if self.grader else f"Faculty #{self.graded_by[:8]}"

    @property
    def assessment_title(self) -> str:
        if self.exam:
            return self.exam.title
        elif self.assignment:
            return self.assignment.title
        elif self.quiz:
            return self.quiz.title
        return f"Assessment"