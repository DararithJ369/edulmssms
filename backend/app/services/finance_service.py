from sqlalchemy.orm import Session
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
from app.services.base_service import get_or_404, paginate, apply_update, create_and_commit, delete_and_commit


class FinanceService:

    # ── Fees ──────────────────────────────────────────────────────────────────

    @staticmethod
    def get_fees(db: Session, page: int = 1, limit: int = 10) -> dict:
        return paginate(db, FeeCollection, FeeCollectionResponse, FeeCollection.created_at.desc(), page, limit)

    @staticmethod
    def create_fee(db: Session, payload: FeeCollectionCreate) -> FeeCollectionResponse:
        return create_and_commit(db, FeeCollection, payload, FeeCollectionResponse)

    @staticmethod
    def update_fee(db: Session, fee_id: int, payload: FeeCollectionUpdate) -> FeeCollectionResponse:
        obj = get_or_404(db, FeeCollection, fee_id, "Fee record")
        apply_update(obj, payload)
        db.commit()
        db.refresh(obj)
        return FeeCollectionResponse.model_validate(obj)

    @staticmethod
    def delete_fee(db: Session, fee_id: int) -> dict:
        return delete_and_commit(db, FeeCollection, fee_id, "Fee record")

    # ── Expenses ──────────────────────────────────────────────────────────────

    @staticmethod
    def get_expenses(db: Session, page: int = 1, limit: int = 10) -> dict:
        return paginate(db, Expense, ExpenseResponse, Expense.created_at.desc(), page, limit)

    @staticmethod
    def create_expense(db: Session, payload: ExpenseCreate) -> ExpenseResponse:
        return create_and_commit(db, Expense, payload, ExpenseResponse)

    @staticmethod
    def update_expense(db: Session, expense_id: int, payload: ExpenseUpdate) -> ExpenseResponse:
        obj = get_or_404(db, Expense, expense_id, "Expense")
        apply_update(obj, payload)
        db.commit()
        db.refresh(obj)
        return ExpenseResponse.model_validate(obj)

    @staticmethod
    def delete_expense(db: Session, expense_id: int) -> dict:
        return delete_and_commit(db, Expense, expense_id, "Expense")

    # ── Salaries ──────────────────────────────────────────────────────────────

    @staticmethod
    def get_salaries(db: Session, page: int = 1, limit: int = 10) -> dict:
        return paginate(db, Salary, SalaryResponse, Salary.created_at.desc(), page, limit)

    @staticmethod
    def create_salary(db: Session, payload: SalaryCreate) -> SalaryResponse:
        return create_and_commit(db, Salary, payload, SalaryResponse)

    @staticmethod
    def update_salary(db: Session, salary_id: int, payload: SalaryUpdate) -> SalaryResponse:
        obj = get_or_404(db, Salary, salary_id, "Salary record")
        apply_update(obj, payload)
        db.commit()
        db.refresh(obj)
        return SalaryResponse.model_validate(obj)

    @staticmethod
    def delete_salary(db: Session, salary_id: int) -> dict:
        return delete_and_commit(db, Salary, salary_id, "Salary record")
