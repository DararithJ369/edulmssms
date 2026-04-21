from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    class_id   = Column(Integer, ForeignKey("classes.id"), nullable=True)

    full_name  = Column(String, nullable=True)
    image      = Column(String, nullable=True)   # profile picture path
    phone      = Column(String, nullable=True)
    address    = Column(String, nullable=True)
    bio        = Column(String, nullable=True)
    
    # Additional demographic fields
    date_of_birth = Column(String, nullable=True)  # ISO format: YYYY-MM-DD
    gender     = Column(String, nullable=True)     # M, F, Other, Prefer not to say
    national_id = Column(String, nullable=True)    # Passport, ID card, etc.
    nationality = Column(String, nullable=True)    # Country/Nationality
    
    # Social/professional links
    website    = Column(String, nullable=True)     # Portfolio, personal website
    linkedin   = Column(String, nullable=True)     # LinkedIn profile URL
    
    # Emergency contact information
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_phone = Column(String, nullable=True)
    emergency_contact_relationship = Column(String, nullable=True)  # Father, Mother, Guardian, etc.
    
    # Health information
    blood_type = Column(String, nullable=True)  # O+, A-, etc.
    medical_conditions = Column(String, nullable=True)  # Allergies, conditions, medications

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── Relationships ─────────────────────────────────────────────────────────
    user = relationship(
        "User",
        back_populates="profile",
        lazy="selectin",
    )
    class_ = relationship(
        "Class",
        back_populates="profiles",
        lazy="selectin",
    )

    # One-to-one extensions — only one will be populated per user
    student_profile = relationship(
        "StudentProfile",
        back_populates="profile",
        uselist=False,          # one-to-one
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    instructor_profile = relationship(
        "InstructorProfile",
        back_populates="profile",
        uselist=False,          # one-to-one
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    parent_profile = relationship(
        "ParentProfile",
        back_populates="profile",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin",
    )