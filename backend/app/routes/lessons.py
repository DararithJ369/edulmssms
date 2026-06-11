from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
import cloudinary.uploader

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
    result = LessonService.get_lessons(db, page, limit)
    
    # 🛠️ Hydrate course_id and module_id directly inside the row dictionaries
    if isinstance(result, dict) and "data" in result:
        for lesson_node in result["data"]:
            if hasattr(lesson_node, "module") and lesson_node.module:
                lesson_node.course_id = lesson_node.module.course_id
                lesson_node.module_name = lesson_node.module.title
                if hasattr(lesson_node.module, "course") and lesson_node.module.course:
                    lesson_node.course_name = lesson_node.module.course.course_name
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

@lesson_router.get("/{lesson_id}", response_model=LessonResponse)
def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
    lesson_node = LessonService.get_lesson_by_id(db, lesson_id)
    
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


# ── Materials Multi-form Controller ──────────────────────────────────────────

@lesson_router.post(
    "/{lesson_id}/materials", 
    dependencies=[Depends(PermissionGuard.admin_or_instructor)]
)
def add_material(
    lesson_id: int,
    title: str = Form(...),
    type: str = Form(...),
    uploaded_by: str = Form(...),
    description: Optional[str] = Form(None),
    external_url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    final_file_url = None
    final_file_size = None

    if file:
        try:
            content_type = file.content_type or ""
            is_video_type = "video" in content_type or type.lower() == "video"
            resource_type_spec = "video" if is_video_type else "raw"
            
            # Send file object straight to Cloudinary bucket namespaces
            upload_result = cloudinary.uploader.upload(
                file.file,
                resource_type=resource_type_spec,
                folder="lms_classroom_materials"
            )
            
            final_file_url = upload_result.get("secure_url")
            
            # Calculate file sizes accurately in bytes
            file.file.seek(0, 2)  
            final_file_size = file.file.tell()
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Cloudinary pipeline failure: {str(e)}"
            )

    material_payload = LessonMaterialCreate(
        lesson_id=lesson_id,
        uploaded_by=uploaded_by,
        title=title,
        description=description,
        type=type.lower(),
        external_url=external_url,
        file_url=final_file_url,
        file_size=final_file_size,
        is_visible=True
    )

    return LessonService.add_material(db, lesson_id, material_payload)