from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(String, ForeignKey("users.id"), nullable=False)  # reference Users table
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    date = Column(Date, nullable=False)
    status = Column(String, nullable=False)  # present, absent, late
    time = Column(String, nullable=True)     # optional, e.g., "09:00 AM"
    note = Column(String, nullable=True)

    recorded_by = Column(String, ForeignKey("users.id"), nullable=False)  # teacher who recorded

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    student = relationship("User", foreign_keys=[student_id], lazy="selectin")
    course = relationship("Course", foreign_keys=[course_id], lazy="selectin")

    @property
    def student_name(self) -> str:
        if self.student and self.student.profile:
            return self.student.profile.full_name or self.student.username
        return self.student.username if self.student else f"Student #{self.student_id}"

    @property
    def course_name(self) -> str:
        return self.course.course_name if self.course else f"Course #{self.course_id}"