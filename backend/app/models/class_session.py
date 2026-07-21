from sqlalchemy import Column, Integer, String, Text, Date, Time, Enum, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class ClassSession(Base):
    __tablename__ = "class_sessions"

    id = Column(Integer, primary_key=True, index=True)

    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    teacher_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    schedule_slot_id = Column(Integer, ForeignKey("schedule_slots.id"), nullable=True)

    title = Column(String, nullable=False)
    description = Column(Text)

    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    room = Column(String)

    status = Column(
        Enum("scheduled", "completed", "cancelled", name="class_status"),
        default="scheduled"
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    class_ = relationship("Class", foreign_keys=[class_id], lazy="selectin")
    subject = relationship("Subject", foreign_keys=[subject_id], lazy="selectin")
    teacher = relationship("User", foreign_keys=[teacher_id], lazy="selectin")
    schedule_slot = relationship("ScheduleSlot", foreign_keys=[schedule_slot_id], lazy="selectin")