from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.config.session import get_db
from app.models.course import Course, Module, Lesson
from app.middleware.guard.permission import PermissionGuard
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/courses-management", tags=["Course Management"])

class ModuleCreate(BaseModel):
    title: str
    description: Optional[str] = None
    order: Optional[int] = None

class LessonCreate(BaseModel):
    title: str
    description: Optional[str] = None
    content: Optional[str] = None
    duration: Optional[str] = "0min"

# Get all courses for management
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

# Create module
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
        order=max_order + 1
    )
    
    db.add(new_module)
    db.commit()
    db.refresh(new_module)
    
    return {"message": "Module created successfully", "data": new_module}

# Create lesson
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
        material_type="article",
        order=max_order + 1
    )
    
    db.add(new_lesson)
    db.commit()
    db.refresh(new_lesson)
    
    return {"message": "Lesson created successfully", "data": new_lesson}

# Update lesson
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
    
    db.commit()
    db.refresh(lesson)
    
    return {"message": "Lesson updated successfully", "data": lesson}

# Update module
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

# Delete module
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

# Delete lesson
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
