from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.config.session import get_db
from app.models.course import Course, Module, Lesson
from app.middleware.guard.permission import PermissionGuard
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/courses-management", tags=["Course Management"])

# ── Upgraded Request Schemas ──────────────────────────────────────────────────

class ModuleCreate(BaseModel):
    title: str
    description: Optional[str] = None
    order: Optional[int] = None

class LessonCreate(BaseModel):
    title: str
    description: Optional[str] = None
    content: Optional[str] = None
    duration: Optional[str] = "0min"
    material_type: Optional[str] = "article"
    material_url: Optional[str] = None
    material_file: Optional[str] = None
    order: Optional[int] = None

# ── Course Routes ─────────────────────────────────────────────────────────────

@router.get("")
def get_courses(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Course)
    
    if search:
        query = query.filter(
            (Course.course_name.ilike(f"%{search}%")) |
            (Course.course_code.ilike(f"%{search}%"))
        )
    
    total = query.count()
    courses = query.offset((page - 1) * limit).limit(limit).all()
    
    return {
        "data": courses,
        "meta": {
            "page": page,
            "limit": limit,
            "total": total
        }
    }

# ── Module Management Routes ──────────────────────────────────────────────────

@router.post("/{course_id}/modules", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def create_module(
    course_id: int,
    module_data: ModuleCreate,
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    max_order = db.query(Module).filter(Module.course_id == course_id).count()
    
    new_module = Module(
        course_id=course_id,
        title=module_data.title,
        description=module_data.description,
        order=module_data.order if module_data.order is not None else (max_order + 1)
    )
    
    db.add(new_module)
    course.has_modules = True
    db.commit()
    db.refresh(new_module)
    
    return {"message": "Module created successfully", "data": new_module}

@router.put("/modules/{module_id}", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def update_module(
    module_id: int,
    module_data: ModuleCreate,
    db: Session = Depends(get_db)
):
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    module.title = module_data.title
    if module_data.description is not None:
        module.description = module_data.description
    if module_data.order is not None:
        module.order = module_data.order
        
    db.commit()
    db.refresh(module)
    
    return {"message": "Module updated successfully", "data": module}

@router.delete("/modules/{module_id}", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def delete_module(
    module_id: int,
    db: Session = Depends(get_db)
):
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    db.delete(module)
    db.commit()
    
    return {"message": "Module deleted successfully"}

# ── Lesson Management Routes ──────────────────────────────────────────────────

@router.post("/modules/{module_id}/lessons", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def create_lesson(
    module_id: int,
    lesson_data: LessonCreate,
    db: Session = Depends(get_db)
):
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    max_order = db.query(Lesson).filter(Lesson.module_id == module_id).count()
    
    new_lesson = Lesson(
        module_id=module_id,
        title=lesson_data.title,
        description=lesson_data.description or "",
        content=lesson_data.content,
        duration=lesson_data.duration or "0min",
        material_type=lesson_data.material_type or "article",
        material_url=lesson_data.material_url,
        material_file=lesson_data.material_file,
        order=lesson_data.order if lesson_data.order is not None else (max_order + 1)
    )
    
    db.add(new_lesson)
    db.commit()
    db.refresh(new_lesson)
    
    return {"message": "Lesson created successfully", "data": new_lesson}

@router.put("/lessons/{lesson_id}", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def update_lesson(
    lesson_id: int,
    lesson_data: LessonCreate,
    db: Session = Depends(get_db)
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    lesson.title = lesson_data.title
    lesson.description = lesson_data.description or lesson.description
    lesson.content = lesson_data.content or lesson.content
    lesson.duration = lesson_data.duration or lesson.duration
    lesson.material_type = lesson_data.material_type or lesson.material_type
    lesson.material_url = lesson_data.material_url or lesson.material_url
    lesson.material_file = lesson_data.material_file or lesson.material_file
    if lesson_data.order is not None:
        lesson.order = lesson_data.order
    
    db.commit()
    db.refresh(lesson)
    
    return {"message": "Lesson updated successfully", "data": lesson}

@router.delete("/lessons/{lesson_id}", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db)
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    db.delete(lesson)
    db.commit()
    
    return {"message": "Lesson deleted successfully"}


class ReorderItemsRequest(BaseModel):
    ids: List[int]


@router.post("/{course_id}/modules/reorder", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def reorder_modules(
    course_id: int,
    payload: ReorderItemsRequest,
    db: Session = Depends(get_db)
):
    modules = db.query(Module).filter(Module.course_id == course_id).all()
    module_map = {m.id: m for m in modules}
    
    for index, m_id in enumerate(payload.ids):
        if m_id in module_map:
            module_map[m_id].order = index + 1
            
    db.commit()
    return {"message": "Modules reordered successfully"}


@router.post("/modules/{module_id}/lessons/reorder", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def reorder_lessons(
    module_id: int,
    payload: ReorderItemsRequest,
    db: Session = Depends(get_db)
):
    lessons = db.query(Lesson).filter(Lesson.module_id == module_id).all()
    lesson_map = {l.id: l for l in lessons}
    
    for index, l_id in enumerate(payload.ids):
        if l_id in lesson_map:
            lesson_map[l_id].order = index + 1
            
    db.commit()
    return {"message": "Lessons reordered successfully"}