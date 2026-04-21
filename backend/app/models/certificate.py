from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String, nullable=False)
    description = Column(Text)

    course_id = Column(Integer, ForeignKey("courses.id"))

    template = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    
class StudentCertificate(Base):
    __tablename__ = "student_certificates"

    id = Column(Integer, primary_key=True, index=True)

    certificate_id = Column(Integer, ForeignKey("certificates.id"))
    student_id = Column(String, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))

    issued_date = Column(DateTime(timezone=True), server_default=func.now())
    completion_date = Column(DateTime)
    
    credential_id = Column(String, unique=True)
    
    certificate_url = Column(String)
    
    status = Column(String, default="Available")