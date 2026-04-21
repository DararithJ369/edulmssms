from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.finance_service import FinanceService
from app.schemas.finance import (
    FeeCollectionCreate,
    FeeCollectionUpdate,
    ExpenseCreate,
    ExpenseUpdate,
    SalaryCreate,
    SalaryUpdate,
)

finance_router = APIRouter(prefix="/finance", tags=["Finance"], dependencies=[Depends(PermissionGuard.admin_only)])


@finance_router.get("/fees")
def get_fees(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    return FinanceService.get_fees(db, page, limit)


@finance_router.post("/fees")
def create_fee(payload: FeeCollectionCreate, db: Session = Depends(get_db)):
    return FinanceService.create_fee(db, payload)


@finance_router.put("/fees/{fee_id}")
def update_fee(fee_id: int, payload: FeeCollectionUpdate, db: Session = Depends(get_db)):
    return FinanceService.update_fee(db, fee_id, payload)


@finance_router.delete("/fees/{fee_id}")
def delete_fee(fee_id: int, db: Session = Depends(get_db)):
    return FinanceService.delete_fee(db, fee_id)


@finance_router.get("/expenses")
def get_expenses(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    return FinanceService.get_expenses(db, page, limit)


@finance_router.post("/expenses")
def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db)):
    return FinanceService.create_expense(db, payload)


@finance_router.put("/expenses/{expense_id}")
def update_expense(expense_id: int, payload: ExpenseUpdate, db: Session = Depends(get_db)):
    return FinanceService.update_expense(db, expense_id, payload)


@finance_router.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    return FinanceService.delete_expense(db, expense_id)


@finance_router.get("/salary")
def get_salaries(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    return FinanceService.get_salaries(db, page, limit)


@finance_router.post("/salary")
def create_salary(payload: SalaryCreate, db: Session = Depends(get_db)):
    return FinanceService.create_salary(db, payload)


@finance_router.put("/salary/{salary_id}")
def update_salary(salary_id: int, payload: SalaryUpdate, db: Session = Depends(get_db)):
    return FinanceService.update_salary(db, salary_id, payload)


@finance_router.delete("/salary/{salary_id}")
def delete_salary(salary_id: int, db: Session = Depends(get_db)):
    return FinanceService.delete_salary(db, salary_id)
