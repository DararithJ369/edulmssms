from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Enrollment(Base):
    __tablename__ = "enrollments"

    id                 = Column(Integer, primary_key=True, index=True)

    # Who
    student_profile_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)

    # What
    course_id          = Column(Integer, ForeignKey("courses.id"), nullable=False)
    grade_level_id     = Column(Integer, ForeignKey("grade_levels.id"), nullable=True)

    # When
    academic_year_id   = Column(Integer, ForeignKey("academic_years.id"), nullable=False)
    term_id            = Column(Integer, ForeignKey("terms.id"), nullable=True)

    # Status
    is_active          = Column(Boolean, default=True, nullable=False)
    enrolled_date      = Column(Date, nullable=True)
    dropped_date       = Column(Date, nullable=True)           # set when unenrolled

    # Payment fields for Stripe integration
    payment_status     = Column(String, default="pending", nullable=True)  # pending, completed, failed
    payment_id         = Column(String, nullable=True)  # Stripe payment intent ID
    amount_paid        = Column(Float, default=0, nullable=True)

    created_at         = Column(DateTime(timezone=True), server_default=func.now())
    updated_at         = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    student_profile = relationship("StudentProfile", back_populates="enrollments", lazy="selectin")
    course          = relationship("Course", back_populates="enrollments", lazy="selectin")
    academic_year   = relationship("AcademicYear", back_populates="enrollments", lazy="selectin")
    term            = relationship("Term", back_populates="enrollments", lazy="selectin")
    grade_level     = relationship("GradeLevel", back_populates="enrollments", lazy="selectin")