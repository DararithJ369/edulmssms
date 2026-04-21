from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel


class FeeCollectionCreate(BaseModel):
    student_name: Optional[str] = None
    reference: Optional[str] = None
    amount: float
    status: Optional[str] = "paid"
    paid_date: Optional[date] = None
    notes: Optional[str] = None


class FeeCollectionUpdate(BaseModel):
    student_name: Optional[str] = None
    reference: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[str] = None
    paid_date: Optional[date] = None
    notes: Optional[str] = None


class FeeCollectionResponse(BaseModel):
    id: int
    student_name: Optional[str] = None
    reference: Optional[str] = None
    amount: float
    status: str
    paid_date: Optional[date] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ExpenseCreate(BaseModel):
    title: str
    category: Optional[str] = None
    amount: float
    spent_date: Optional[date] = None
    notes: Optional[str] = None


class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    spent_date: Optional[date] = None
    notes: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: int
    title: str
    category: Optional[str] = None
    amount: float
    spent_date: Optional[date] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class SalaryCreate(BaseModel):
    staff_name: str
    role: Optional[str] = None
    month: Optional[str] = None
    amount: float
    status: Optional[str] = "paid"
    paid_date: Optional[date] = None
    notes: Optional[str] = None


class SalaryUpdate(BaseModel):
    staff_name: Optional[str] = None
    role: Optional[str] = None
    month: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[str] = None
    paid_date: Optional[date] = None
    notes: Optional[str] = None


class SalaryResponse(BaseModel):
    id: int
    staff_name: str
    role: Optional[str] = None
    month: Optional[str] = None
    amount: float
    status: str
    paid_date: Optional[date] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
