from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.base import Base

# ---------------- Course ----------------
class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    course_name = Column(String, nullable=False)
    course_code = Column(String, nullable=False, unique=True)
    description = Column(Text)
    category = Column(String)
    duration = Column(Integer)  # weeks
    price = Column(Float)
    max_students = Column(Integer)
    difficulty = Column(String, default="beginner")
    instructor_name = Column(String)
    instructor_id = Column(String, ForeignKey("users.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)

    thumbnail = Column(String)
    enrollment_status = Column(String, default="open")
    student_enrolled = Column(Integer, default=0)
    has_modules = Column(Boolean, default=False)
    has_quizzes = Column(Boolean, default=False)
    certificate_offered = Column(Boolean, default=False)
    certificate_title = Column(String)
    certificate_description = Column(String)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    subject = relationship("Subject", back_populates="courses")
    # Instructor relationship: Course.instructor_id → User.id
    instructor = relationship(
        "User",
        foreign_keys=[instructor_id],
        lazy="selectin",
        overlaps="courses",
    )
    enrollments = relationship("Enrollment", back_populates="course", lazy="selectin")

# ---------------- Module ----------------
class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    order = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# ---------------- Lesson ----------------
class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    duration = Column(String, nullable=False)  # e.g., "10min"
    material_type = Column(String)  # video, article, quiz
    material_url = Column(String)
    material_file = Column(String)
    order = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

