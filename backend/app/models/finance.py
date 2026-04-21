from sqlalchemy import Column, Integer, String, Float, Date, DateTime
from sqlalchemy.sql import func
from app.db.base import Base


class FeeCollection(Base):
    __tablename__ = "fee_collections"

    id = Column(Integer, primary_key=True, index=True)
    student_name = Column(String, nullable=True)
    reference = Column(String, nullable=True)
    amount = Column(Float, nullable=False, default=0)
    status = Column(String, nullable=False, default="paid")
    paid_date = Column(Date, nullable=True)
    notes = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=True)
    amount = Column(Float, nullable=False, default=0)
    spent_date = Column(Date, nullable=True)
    notes = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Salary(Base):
    __tablename__ = "salaries"

    id = Column(Integer, primary_key=True, index=True)
    staff_name = Column(String, nullable=False)
    role = Column(String, nullable=True)
    month = Column(String, nullable=True)  # e.g. "2026-04"
    amount = Column(Float, nullable=False, default=0)
    status = Column(String, nullable=False, default="paid")
    paid_date = Column(Date, nullable=True)
    notes = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
