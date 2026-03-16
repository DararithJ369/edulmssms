from sqlalchemy import Column, Integer, String, Text, Date, Time, Enum, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base


class ClassSession(Base):
    __tablename__ = "class_sessions"

    id = Column(Integer, primary_key=True, index=True)

    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    teacher_id = Column(String, ForeignKey("users.id"), nullable=False)

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