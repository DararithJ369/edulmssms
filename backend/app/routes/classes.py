from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.class_service import ClassService
from app.schemas.class_ import ClassCreate, ClassUpdate, ClassResponse
from app.schemas.class_session import ClassSessionCreate, ClassSessionResponse
from app.models.user import User 

class_router = APIRouter(prefix="/classes", tags=["Classes"])


@class_router.get("")
def get_all_classes(
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    _: User = Depends(PermissionGuard.get_current_user),
):
    return ClassService.get_classes(db, page, limit)


@class_router.get("/{class_id}", response_model=ClassResponse)
def get_class(
    class_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(PermissionGuard.get_current_user),
):
    return ClassService.get_class_by_id(db, class_id)


@class_router.post("", response_model=ClassResponse, dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def create_class(payload: ClassCreate, db: Session = Depends(get_db)):
    return ClassService.create_class(db, payload)


@class_router.put("/{class_id}", response_model=ClassResponse, dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def update_class(class_id: int, payload: ClassUpdate, db: Session = Depends(get_db)):
    return ClassService.update_class(db, class_id, payload)


@class_router.delete("/{class_id}", dependencies=[Depends(PermissionGuard.admin_only)])
def delete_class(class_id: int, db: Session = Depends(get_db)):
    return ClassService.delete_class(db, class_id)


# ── Students ──────────────────────────────────────────────────────────────────

@class_router.get("/{class_id}/students")
def get_class_students(
    class_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(PermissionGuard.get_current_user),
):
    return ClassService.get_class_students(db, class_id)


@class_router.post("/{class_id}/students/{student_id}", response_model=ClassResponse,
                   dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def add_student(class_id: int, student_id: str, db: Session = Depends(get_db)):
    return ClassService.add_student(db, class_id, student_id)


@class_router.delete("/{class_id}/students/{student_id}",
                     dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def remove_student(class_id: int, student_id: str, db: Session = Depends(get_db)):
    return ClassService.remove_student(db, class_id, student_id)


# ── Sessions ──────────────────────────────────────────────────────────────────

@class_router.get("/{class_id}/sessions")
def get_class_sessions(
    class_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(PermissionGuard.get_current_user),
):
    return ClassService.get_class_sessions(db, class_id)


@class_router.post("/{class_id}/sessions", response_model=ClassSessionResponse,
                   dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def create_session(class_id: int, payload: ClassSessionCreate, db: Session = Depends(get_db)):
    return ClassService.create_session(db, class_id, payload)