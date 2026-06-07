from sqlalchemy import Column, Integer, String, Time, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class ScheduleSlot(Base):
    __tablename__ = "schedule_slots"

    id = Column(Integer, primary_key=True, index=True)

    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    teacher_id = Column(String, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)

    day_of_week = Column(String, nullable=False)  # e.g., "MONDAY", "TUESDAY", etc.
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    room = Column(String, nullable=True)

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    class_ = relationship("Class", foreign_keys=[class_id], lazy="selectin")
    teacher = relationship("User", foreign_keys=[teacher_id], lazy="selectin")
    subject = relationship("Subject", foreign_keys=[subject_id], lazy="selectin")
