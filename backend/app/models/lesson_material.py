from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.base import Base


class LessonMaterial(Base):
    __tablename__ = "lesson_materials"

    id = Column(Integer, primary_key=True, index=True)

    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    uploaded_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    lesson = relationship("Lesson", back_populates="materials")

    title = Column(String, nullable=False)
    description = Column(Text)

    file_url = Column(String, nullable=True)
    external_url = Column(String, nullable=True)

    type = Column(String, nullable=False)

    file_size = Column(Integer)

    is_visible = Column(Boolean, default=True)

    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())