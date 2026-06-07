from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)

    # Generalized relation
    submission_type = Column(String, nullable=False)  # "assignment", "quiz", "exam"
    reference_id = Column(Integer, nullable=False)  # assignment_id, quiz_id, or exam_id

    student_id = Column(String, ForeignKey("users.id"), nullable=False)

    submission_file = Column(String, nullable=True)
    submission_text = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    status = Column(String, default="submitted")  # submitted, graded, late

    score = Column(Float, nullable=True)
    graded_at = Column(DateTime, nullable=True)
    feedback = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    student = relationship("User", foreign_keys=[student_id], lazy="selectin")

    @property
    def student_name(self) -> str:
        if self.student:
            if self.student.profile and self.student.profile.full_name:
                return self.student.profile.full_name
            return self.student.username
        return ""

    @property
    def student_code(self) -> str:
        if self.student and self.student.profile and self.student.profile.student_profile:
            return self.student.profile.student_profile.student_id or ""
        return ""