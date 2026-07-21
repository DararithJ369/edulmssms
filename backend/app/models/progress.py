from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime
from sqlalchemy.sql import func
from app.db.base import Base


class StudentCourseProgress(Base):
    __tablename__ = "student_course_progress"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, nullable=False, index=True)
    course_id = Column(Integer, nullable=False, index=True)
    progress_percentage = Column(Float, default=0.0, nullable=False)
    completed_lessons = Column(Integer, default=0, nullable=False)
    completed_modules = Column(Integer, default=0, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class StudentLessonProgress(Base):
    __tablename__ = "student_lesson_progress"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, nullable=False, index=True)
    lesson_id = Column(Integer, nullable=False, index=True)
    completed = Column(Boolean, default=True, nullable=False)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())


class StudentModuleProgress(Base):
    __tablename__ = "student_module_progress"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, nullable=False, index=True)
    module_id = Column(Integer, nullable=False, index=True)
    completed = Column(Boolean, default=True, nullable=False)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())
