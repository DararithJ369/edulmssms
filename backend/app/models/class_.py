from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)

    grade_id = Column(Integer, ForeignKey("grades.id"), nullable=False)
    supervisor_id = Column(String, ForeignKey("users.id"), nullable=False)

    name = Column(String, nullable=False)  # e.g. Grade 10
    section = Column(String, nullable=True)  # A, B, C
    room = Column(String, nullable=True)

    capacity = Column(Integer, default=30)

    academic_year = Column(String, nullable=False)  # e.g. "2025-26"

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    profiles = relationship(
        "UserProfile",
        back_populates="class_",
        lazy="selectin",
    )
    supervisor = relationship("User", foreign_keys=[supervisor_id], lazy="selectin")

    @property
    def supervisor_name(self) -> str:
        if self.supervisor and self.supervisor.profile:
            return self.supervisor.profile.full_name or self.supervisor.username
        return self.supervisor.username if self.supervisor else f"Staff #{self.supervisor_id[:8]}"