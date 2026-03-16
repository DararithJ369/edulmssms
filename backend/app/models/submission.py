from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
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