from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Term(Base):
    __tablename__ = "terms"

    id               = Column(Integer, primary_key=True, index=True)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)

    name       = Column(String, nullable=False)   # e.g. "Term 1", "Semester 1"
    start_date = Column(Date, nullable=False)
    end_date   = Column(Date, nullable=False)
    is_current = Column(Boolean, default=False, nullable=False)
    is_active  = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    academic_year = relationship("AcademicYear", back_populates="terms", lazy="selectin")
    enrollments   = relationship("Enrollment", back_populates="term", lazy="selectin")