from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.base import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, nullable=False)  # 'assignment', 'announcement', 'grade', 'ai_recommendation'
    is_read = Column(Boolean, nullable=False, default=False)
    reference_id = Column(Integer, nullable=True)  # course_id, assignment_id, result_id etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", lazy="selectin")
