from typing import Optional
from fastapi import APIRouter, Depends, Form
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.result_service import ResultService
from app.schemas.result import ResultCreate, ResultUpdate, ResultResponse

result_router = APIRouter(prefix="/results", tags=["Results"])


@result_router.get("", dependencies=[Depends(PermissionGuard.admin_or_teacher)])
def get_all_results(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    return ResultService.get_results(db, page, limit)


@result_router.get("/{result_id}", response_model=ResultResponse)
def get_result(result_id: int, db: Session = Depends(get_db)):
    return ResultService.get_result_by_id(db, result_id)


@result_router.post("", response_model=ResultResponse, dependencies=[Depends(PermissionGuard.admin_or_teacher)])
def create_result(payload: ResultCreate, db: Session = Depends(get_db)):
    return ResultService.create_result(db, payload)


@result_router.put("/{result_id}", response_model=ResultResponse, dependencies=[Depends(PermissionGuard.admin_or_teacher)])
def update_result(
    result_id: int,
    score: Optional[float] = Form(None),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    return ResultService.update_result(
        db, result_id, ResultUpdate(score=score, notes=notes)
    )


@result_router.delete("/{result_id}", dependencies=[Depends(PermissionGuard.admin_only)])
def delete_result(result_id: int, db: Session = Depends(get_db)):
    return ResultService.delete_result(db, result_id)