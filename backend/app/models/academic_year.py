from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class AcademicYear(Base):
    __tablename__ = "academic_years"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String, nullable=False, unique=True)   # e.g. "2024-2025"
    start_date = Column(Date, nullable=False)
    end_date   = Column(Date, nullable=False)
    is_current = Column(Boolean, default=False, nullable=False) # only one active at a time
    is_active  = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    terms       = relationship("Term", back_populates="academic_year", cascade="all, delete-orphan", lazy="selectin")
    enrollments = relationship("Enrollment", back_populates="academic_year", lazy="selectin")