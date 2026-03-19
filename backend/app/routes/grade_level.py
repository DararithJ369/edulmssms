from typing import Optional
from fastapi import APIRouter, Depends, Form
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.grade_level_service import GradeLevelService
from app.schemas.grade_level import GradeLevelCreate, GradeLevelUpdate, GradeLevelResponse

grade_level_router = APIRouter(prefix="/grade-levels", tags=["Grade Levels"])


@grade_level_router.get("/setup-form", dependencies=[Depends(PermissionGuard.admin_only)])
def setup_form(db: Session = Depends(get_db)):
    return GradeLevelService.setup_form(db)


@grade_level_router.get("")
def get_all_grade_levels(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    return GradeLevelService.get_grade_levels(db, page, limit)


@grade_level_router.get("/{level_id}", response_model=GradeLevelResponse)
def get_grade_level(level_id: int, db: Session = Depends(get_db)):
    return GradeLevelService.get_grade_level_by_id(db, level_id)


@grade_level_router.post("", response_model=GradeLevelResponse, dependencies=[Depends(PermissionGuard.admin_only)])
def create_grade_level(
    name:        str           = Form(...),
    code:        Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    order:       int           = Form(0),
    is_active:   bool          = Form(True),
    db: Session = Depends(get_db),
):
    return GradeLevelService.create_grade_level(
        db,
        GradeLevelCreate(name=name, code=code, description=description, order=order, is_active=is_active),
    )


@grade_level_router.put("/{level_id}", response_model=GradeLevelResponse, dependencies=[Depends(PermissionGuard.admin_only)])
def update_grade_level(
    level_id:    int,
    name:        Optional[str]  = Form(None),
    code:        Optional[str]  = Form(None),
    description: Optional[str]  = Form(None),
    order:       Optional[int]  = Form(None),
    is_active:   Optional[bool] = Form(None),
    db: Session = Depends(get_db),
):
    return GradeLevelService.update_grade_level(
        db,
        level_id,
        GradeLevelUpdate(name=name, code=code, description=description, order=order, is_active=is_active),
    )


@grade_level_router.delete("/{level_id}", dependencies=[Depends(PermissionGuard.admin_only)])
def delete_grade_level(level_id: int, db: Session = Depends(get_db)):
    return GradeLevelService.delete_grade_level(db, level_id)


@grade_level_router.get("/{level_id}/classes")
def get_grade_level_classes(level_id: int, db: Session = Depends(get_db)):
    return GradeLevelService.get_grade_level_classes(db, level_id)