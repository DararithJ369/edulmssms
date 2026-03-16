from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from app.models.lesson import Lesson 
from app.models.lesson_material import LessonMaterial
from app.schemas.lesson import LessonCreate, LessonUpdate, LessonResponse
from app.schemas.lesson_material import LessonMaterialCreate, LessonMaterialResponse
from app.utils.get_image import get_image


class LessonService:

    @staticmethod
    def get_lessons(db: Session, page: int = 1, limit: int = 10) -> dict:
        total = db.query(func.count(Lesson.id)).scalar()
        lessons = (
            db.query(Lesson)
            .order_by(Lesson.course_id.asc(), Lesson.order.asc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return {
            "data": [LessonResponse.model_validate(l) for l in lessons],
            "meta": {"page": page, "total": total, "limit": limit},
        }

    @staticmethod
    def get_lesson_by_id(db: Session, lesson_id: int) -> LessonResponse:
        obj = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Lesson not found")
        return LessonResponse.model_validate(obj)

    @staticmethod
    def create_lesson(db: Session, lesson_in: LessonCreate) -> LessonResponse:
        obj = Lesson(**lesson_in.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return LessonResponse.model_validate(obj)

    @staticmethod
    def update_lesson(db: Session, lesson_id: int, lesson_in: LessonUpdate) -> LessonResponse:
        obj = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Lesson not found")
        for field, value in lesson_in.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        db.commit()
        db.refresh(obj)
        return LessonResponse.model_validate(obj)

    @staticmethod
    def delete_lesson(db: Session, lesson_id: int) -> dict:
        obj = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Lesson not found")
        db.delete(obj)
        db.commit()
        return {"detail": "Lesson deleted successfully"}

    # ── Materials ─────────────────────────────────────────────────────────────

    @staticmethod
    def get_lesson_materials(db: Session, lesson_id: int) -> list:
        if not db.query(Lesson).filter(Lesson.id == lesson_id).first():
            raise HTTPException(status_code=404, detail="Lesson not found")
        materials = (
            db.query(LessonMaterial)
            .filter(LessonMaterial.lesson_id == lesson_id)
            .order_by(LessonMaterial.id.asc())
            .all()
        )
        return [LessonMaterialResponse.model_validate(m) for m in materials]

    @staticmethod
    def add_material(
        db: Session,
        lesson_id: int,
        material_in: LessonMaterialCreate,
        file: Optional[UploadFile] = None,
    ) -> LessonMaterialResponse:
        if not db.query(Lesson).filter(Lesson.id == lesson_id).first():
            raise HTTPException(status_code=404, detail="Lesson not found")
        material = LessonMaterial(lesson_id=lesson_id, **material_in.model_dump())
        if file:
            material.file_url = get_image(file)
        db.add(material)
        db.commit()
        db.refresh(material)
        return LessonMaterialResponse.model_validate(material)

    @staticmethod
    def delete_material(db: Session, material_id: int) -> dict:
        material = db.query(LessonMaterial).filter(LessonMaterial.id == material_id).first()
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")
        db.delete(material)
        db.commit()
        return {"detail": "Material deleted successfully"}