from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


# Association table — one parent can have multiple students, one student can
# have multiple parents (e.g. mother + father)
parent_student = Table(
    "parent_student",
    Base.metadata,
    Column("parent_profile_id", Integer, ForeignKey("parent_profiles.id"), primary_key=True),
    Column("student_profile_id", Integer, ForeignKey("student_profiles.id"), primary_key=True),
)


class ParentProfile(Base):
    __tablename__ = "parent_profiles"

    id         = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False, unique=True)

    occupation      = Column(String, nullable=True)
    parent_relationship    = Column(String, nullable=True)   # e.g. "Father", "Mother", "Guardian"
    emergency_phone = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── Relationships ─────────────────────────────────────────────────────────
    profile = relationship(
        "UserProfile",
        back_populates="parent_profile",
        lazy="selectin",
    )
    students = relationship(
        "StudentProfile",
        secondary=parent_student,
        back_populates="parents",
        lazy="selectin",
    )