from uuid import uuid4

from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.config.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    image = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)

    # Foreign key to Role
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    role = relationship("Role", back_populates="users")
    profile = relationship("UserProfile", back_populates="user", uselist=False, lazy="selectin")
    subjects = relationship("Subject", back_populates="instructor", lazy="select")
    courses = relationship("Course", foreign_keys="Course.instructor_id", lazy="select", overlaps="instructor")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    @property
    def profile_image(self):
        """Return the profile picture from UserProfile (used in list responses)."""
        if self.profile and self.profile.image:
            return self.profile.image
        return self.image  # fall back to user-level image if set