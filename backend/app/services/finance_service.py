from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.finance import FeeCollection, Expense, Salary
from app.schemas.finance import (
    FeeCollectionCreate,
    FeeCollectionUpdate,
    ExpenseCreate,
    ExpenseUpdate,
    SalaryCreate,
    SalaryUpdate,
    FeeCollectionResponse,
    ExpenseResponse,
    SalaryResponse,
)


class FinanceService:

    @staticmethod
    def get_fees(db: Session, page: int = 1, limit: int = 10) -> dict:
        total = db.query(func.count(FeeCollection.id)).scalar()
        items = (
            db.query(FeeCollection)
            .order_by(FeeCollection.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return {
            "data": [FeeCollectionResponse.model_validate(i) for i in items],
            "meta": {"page": page, "total": total, "limit": limit},
        }

    @staticmethod
    def create_fee(db: Session, payload: FeeCollectionCreate) -> FeeCollectionResponse:
        obj = FeeCollection(**payload.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return FeeCollectionResponse.model_validate(obj)

    @staticmethod
    def update_fee(db: Session, fee_id: int, payload: FeeCollectionUpdate) -> FeeCollectionResponse:
        obj = db.query(FeeCollection).filter(FeeCollection.id == fee_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Fee record not found")
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        db.commit()
        db.refresh(obj)
        return FeeCollectionResponse.model_validate(obj)

    @staticmethod
    def delete_fee(db: Session, fee_id: int) -> dict:
        obj = db.query(FeeCollection).filter(FeeCollection.id == fee_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Fee record not found")
        db.delete(obj)
        db.commit()
        return {"detail": "Fee record deleted"}

    @staticmethod
    def get_expenses(db: Session, page: int = 1, limit: int = 10) -> dict:
        total = db.query(func.count(Expense.id)).scalar()
        items = (
            db.query(Expense)
            .order_by(Expense.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return {
            "data": [ExpenseResponse.model_validate(i) for i in items],
            "meta": {"page": page, "total": total, "limit": limit},
        }

    @staticmethod
    def create_expense(db: Session, payload: ExpenseCreate) -> ExpenseResponse:
        obj = Expense(**payload.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return ExpenseResponse.model_validate(obj)

    @staticmethod
    def update_expense(db: Session, expense_id: int, payload: ExpenseUpdate) -> ExpenseResponse:
        obj = db.query(Expense).filter(Expense.id == expense_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Expense not found")
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        db.commit()
        db.refresh(obj)
        return ExpenseResponse.model_validate(obj)

    @staticmethod
    def delete_expense(db: Session, expense_id: int) -> dict:
        obj = db.query(Expense).filter(Expense.id == expense_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Expense not found")
        db.delete(obj)
        db.commit()
        return {"detail": "Expense deleted"}

    @staticmethod
    def get_salaries(db: Session, page: int = 1, limit: int = 10) -> dict:
        total = db.query(func.count(Salary.id)).scalar()
        items = (
            db.query(Salary)
            .order_by(Salary.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return {
            "data": [SalaryResponse.model_validate(i) for i in items],
            "meta": {"page": page, "total": total, "limit": limit},
        }

    @staticmethod
    def create_salary(db: Session, payload: SalaryCreate) -> SalaryResponse:
        obj = Salary(**payload.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return SalaryResponse.model_validate(obj)

    @staticmethod
    def update_salary(db: Session, salary_id: int, payload: SalaryUpdate) -> SalaryResponse:
        obj = db.query(Salary).filter(Salary.id == salary_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Salary record not found")
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        db.commit()
        db.refresh(obj)
        return SalaryResponse.model_validate(obj)

    @staticmethod
    def delete_salary(db: Session, salary_id: int) -> dict:
        obj = db.query(Salary).filter(Salary.id == salary_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Salary record not found")
        db.delete(obj)
        db.commit()
        return {"detail": "Salary record deleted"}
