from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.db.base import Base


class Grade(Base):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)  # e.g. "Grade 10"
    level = Column(Integer, nullable=False)  # e.g. 10
    description = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())