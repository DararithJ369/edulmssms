from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.lesson_service import LessonService
from app.schemas.lesson import LessonCreate, LessonUpdate, LessonResponse
from app.schemas.lesson_material import LessonMaterialCreate

lesson_router = APIRouter(prefix="/lessons", tags=["Lessons"])


# ── Static sub-paths — MUST be before /{lesson_id} ───────────────────────────


@lesson_router.delete(
    "materials/{material_id}", 
    dependencies=[Depends(PermissionGuard.admin_or_instructor)]
)
def delete_material(material_id: int, db: Session = Depends(get_db)):
    return LessonService.delete_material(db, material_id)


# ── Collection ────────────────────────────────────────────────────────────────


@lesson_router.get("")
def get_all_lessons(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    return LessonService.get_lessons(db, page, limit)


@lesson_router.post(
    "", 
    response_model=LessonResponse, 
    dependencies=[Depends(PermissionGuard.admin_or_instructor)]
)
def create_lesson(payload: LessonCreate, db: Session = Depends(get_db)):
    return LessonService.create_lesson(db, payload)


# ── Dynamic /{lesson_id} — MUST be last ──────────────────────────────────────


@lesson_router.get("/{lesson_id}", response_model=LessonResponse)
def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
    return LessonService.get_lesson_by_id(db, lesson_id)


@lesson_router.put(
    "/{lesson_id}", 
    response_model=LessonResponse, 
    dependencies=[Depends(PermissionGuard.admin_or_instructor)]
)
def update_lesson(lesson_id: int, payload: LessonUpdate, db: Session = Depends(get_db)):
    return LessonService.update_lesson(db, lesson_id, payload)


@lesson_router.delete(
    "/{lesson_id}", 
    dependencies=[Depends(PermissionGuard.admin_or_instructor)]
)
def delete_lesson(lesson_id: int, db: Session = Depends(get_db)):
    return LessonService.delete_lesson(db, lesson_id)


@lesson_router.delete("/materials/{material_id}", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def delete_material(material_id: int, db: Session = Depends(get_db)):
    return LessonService.delete_material(db, material_id)



@lesson_router.post("/{lesson_id}/materials", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def add_material(
    lesson_id: int,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    return LessonService.add_material(
        db, lesson_id, LessonMaterialCreate(title=title, description=description), file
    )