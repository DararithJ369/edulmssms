from typing import Optional, Dict, Any
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
    "/materials/{material_id}", 
    dependencies=[Depends(PermissionGuard.admin_or_instructor)]
)
def delete_material(material_id: int, db: Session = Depends(get_db)):
    return LessonService.delete_material(db, material_id)


# ── Collection ────────────────────────────────────────────────────────────────

@lesson_router.get("")
def get_all_lessons(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    # Fetch base response dictionary payload metadata from service layers
    result = LessonService.get_lessons(db, page, limit)
    
    # 🛠️ CRITICAL STEP: Hydrate course_id and module_id directly inside the row dictionaries
    # so your Next.js application receives valid numeric properties instead of empty tracks!
    if isinstance(result, dict) and "data" in result:
        for lesson_node in result["data"]:
            # If the database returns an ORM entity or instance object wrapper
            if hasattr(lesson_node, "module") and lesson_node.module:
                lesson_node.course_id = lesson_node.module.course_id
                lesson_node.module_name = lesson_node.module.title
                if hasattr(lesson_node.module, "course") and lesson_node.module.course:
                    lesson_node.course_name = lesson_node.module.course.course_name
            # If the database layer returns raw dictionary sets instead
            elif isinstance(lesson_node, dict) and "module" in lesson_node and lesson_node["module"]:
                lesson_node["course_id"] = lesson_node["module"].get("course_id")
                lesson_node["module_name"] = lesson_node["module"].get("title")
                if lesson_node["module"].get("course"):
                    lesson_node["course_name"] = lesson_node["module"]["course"].get("course_name")
                    
    return result


@lesson_router.post(
    "", 
    response_model=LessonResponse, 
    dependencies=[Depends(PermissionGuard.admin_or_instructor)]
)
def create_lesson(payload: LessonCreate, db: Session = Depends(get_db)):
    return LessonService.create_lesson(db, payload)


# ── Dynamic /{lesson_id} — MUST be last ──────────────────────────────────────

# 🛠️ FIXED: Standardized response serialization to prevent key mismatches
@lesson_router.get("/{lesson_id}", response_model=LessonResponse)
def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
    lesson_node = LessonService.get_lesson_by_id(db, lesson_id)
    
    # Hydrate tracking identifiers cleanly prior to component payload serialization dispatch
    if lesson_node and hasattr(lesson_node, "module") and lesson_node.module:
        lesson_node.course_id = lesson_node.module.course_id
        lesson_node.module_name = lesson_node.module.title
        if hasattr(lesson_node.module, "course") and lesson_node.module.course:
            lesson_node.course_name = lesson_node.module.course.course_name
            
    return lesson_node


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