from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.config.base import Base


class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    users = relationship("User", back_populates="role")