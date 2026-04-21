from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
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