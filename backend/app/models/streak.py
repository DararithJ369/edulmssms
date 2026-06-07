from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.config.base import Base

class StudentStreak(Base):
    __tablename__ = "student_streaks"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    current_streak = Column(Integer, nullable=False, default=0)
    longest_streak = Column(Integer, nullable=False, default=0)
    last_activity_date = Column(Date, nullable=True)

    # Relationship to user
    student = relationship("User", lazy="selectin")
