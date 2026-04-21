from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from app.config.base import Base


class Lesson(Base):
    __tablename__ = "lesson"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    duration = Column(Integer, nullable=True)  # Duration in minutes
    material_type = Column(String, nullable=True)  # video, text, quiz, etc.
    material_url = Column(String, nullable=True)
    material_file = Column(String, nullable=True)  # file path or URL to the material
    order = Column(Integer, nullable=False)  # order of the lesson within the module
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())    