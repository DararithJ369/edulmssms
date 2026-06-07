from typing import Optional
from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.result_service import ResultService
from app.schemas.result import ResultCreate, ResultUpdate, ResultResponse
from app.models.result import Result
from app.models.enrollment import Enrollment

result_router = APIRouter(prefix="/results", tags=["Results"])


@result_router.get("")
def get_all_results(
    page: int = 1,
    limit: int = 10,
    search: str = "",
    type: str = "",
    current_user = Depends(PermissionGuard.get_current_user),
    db: Session = Depends(get_db),
):
    return ResultService.get_results(db, page, limit, search, type, current_user)


@result_router.get("/{result_id}", response_model=ResultResponse)
def get_result(
    result_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(PermissionGuard.get_current_user)
):
    result_obj = db.query(Result).filter(Result.id == result_id).first()
    if not result_obj:
        raise HTTPException(status_code=404, detail="Result not found")
    if not PermissionGuard.can_view_student(db, current_user, result_obj.student_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    return ResultResponse.model_validate(result_obj)


@result_router.post("", response_model=ResultResponse, dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def create_result(payload: ResultCreate, db: Session = Depends(get_db)):
    return ResultService.create_result(db, payload)


@result_router.put("/{result_id}", response_model=ResultResponse, dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def update_result(
    result_id: int,
    score: Optional[float] = Form(None),
    feedback: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    return ResultService.update_result(
        db, result_id, ResultUpdate(score=score, feedback=feedback)
    )


@result_router.delete("/{result_id}", dependencies=[Depends(PermissionGuard.admin_only)])
def delete_result(result_id: int, db: Session = Depends(get_db)):
    return ResultService.delete_result(db, result_id)