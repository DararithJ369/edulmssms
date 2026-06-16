from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload  
from fastapi import HTTPException, UploadFile
from app.models.course import Lesson, Module # Ensure Module is imported
from app.models.lesson_material import LessonMaterial
from app.schemas.lesson import LessonCreate, LessonUpdate, LessonResponse
from app.schemas.lesson_material import LessonMaterialCreate, LessonMaterialResponse
from app.utils.get_image import get_image


class LessonService:

    @staticmethod
    def get_lessons(
        db: Session,
        page: int = 1,
        limit: int = 10,
        class_id: Optional[int] = None,
        course_id: Optional[int] = None
    ) -> dict:
        query = db.query(Lesson)

        if course_id is not None or class_id is not None:
            query = query.join(Module)
            if course_id is not None:
                query = query.filter(Module.course_id == course_id)
            if class_id is not None:
                from app.services.base_service import get_course_ids_for_class
                course_ids = get_course_ids_for_class(db, class_id)
                query = query.filter(Module.course_id.in_(course_ids))

        total = query.with_entities(func.count(Lesson.id)).scalar()
        
        lessons = (
            query
            .options(joinedload(Lesson.module).joinedload(Module.course))
            .order_by(Lesson.module_id.asc(), Lesson.order.asc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        
        # 💡 THE FIX: Construct clean dictionaries to safely sidestep model property setters
        validated_lessons = []
        for l in lessons:
            # 1. Cast the database model records to a raw Python dictionary
            lesson_dict = {c.name: getattr(l, c.name) for c in l.__table__.columns}
            
            # 2. Pull the relationship parameters out dynamically
            has_mod = hasattr(l, "module") and l.module
            has_crs = has_mod and hasattr(l.module, "course") and l.module.course
            
            # 3. Securely append values straight to our decoupled payload dictionary
            lesson_dict["module_name"] = l.module.title if has_mod else "Unknown Module"
            lesson_dict["course_id"] = l.module.course.id if has_crs else None
            lesson_dict["course_name"] = l.module.course.course_name if has_crs else "Unknown Course"
            
            # 4. Use model_validate onto the formatted custom dictionary tracker
            validated_lessons.append(LessonResponse.model_validate(lesson_dict))

        return {
            "data": validated_lessons,
            "meta": {"page": page, "total": total, "limit": limit},
        }

    @staticmethod
    def get_lesson_by_id(db: Session, lesson_id: int) -> LessonResponse:
        obj = (
            db.query(Lesson)
            .options(joinedload(Lesson.module).joinedload(Module.course))
            .filter(Lesson.id == lesson_id)
            .first()
        )
        if not obj:
            raise HTTPException(status_code=404, detail="Lesson not found")
            
        # 💡 THE FIX: Apply identical dictionary parsing approach to single item lookups
        lesson_dict = {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
        
        has_mod = hasattr(obj, "module") and obj.module
        has_crs = has_mod and hasattr(obj.module, "course") and obj.module.course
        
        lesson_dict["module_name"] = obj.module.title if has_mod else "Unknown Module"
        lesson_dict["course_id"] = obj.module.course.id if has_crs else None
        lesson_dict["course_name"] = obj.module.course.course_name if has_crs else "Unknown Course"
                
        # Hydrate nested materials, quizzes, and assignments
        from app.models.lesson_material import LessonMaterial
        from app.models.quiz import Quiz
        from app.models.assignment import Assignment
        from app.schemas.lesson_material import LessonMaterialResponse
        from app.schemas.quiz import QuizResponse
        from app.schemas.assignment import AssignmentResponse

        materials = db.query(LessonMaterial).filter(LessonMaterial.lesson_id == lesson_id).order_by(LessonMaterial.id.asc()).all()
        quizzes = db.query(Quiz).filter(Quiz.lesson_id == lesson_id).all()
        assignments = db.query(Assignment).filter(Assignment.lesson_id == lesson_id).all()

        lesson_dict["materials"] = [LessonMaterialResponse.model_validate(m) for m in materials]
        lesson_dict["quizzes"] = [QuizResponse.model_validate(q) for q in quizzes]
        lesson_dict["assignments"] = [AssignmentResponse.model_validate(a) for a in assignments]

        return LessonResponse.model_validate(lesson_dict)

    @staticmethod
    def create_lesson(db: Session, lesson_in: LessonCreate) -> LessonResponse:
        obj = Lesson(**lesson_in.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return LessonService.get_lesson_by_id(db, obj.id) 

    @staticmethod
    def update_lesson(db: Session, lesson_id: int, lesson_in: LessonUpdate) -> LessonResponse:
        obj = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Lesson not found")
        for field, value in lesson_in.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        db.commit()
        db.refresh(obj)
        return LessonService.get_lesson_by_id(db, obj.id) 

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
        data = material_in.model_dump()
        data["lesson_id"] = lesson_id
        material = LessonMaterial(**data)
        if file:
            material.file_url = get_image(file)  # type: ignore
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

    @staticmethod
    def update_material(
        db: Session,
        material_id: int,
        material_in: any
    ) -> LessonMaterialResponse:
        from app.models.lesson_material import LessonMaterial
        from app.schemas.lesson_material import LessonMaterialUpdate
        material = db.query(LessonMaterial).filter(LessonMaterial.id == material_id).first()
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")
        data = material_in.model_dump(exclude_unset=True)
        ext_url = data.pop("external_url", None)
        if ext_url:
            data["file_url"] = ext_url
        for field, value in data.items():
            setattr(material, field, value)
        db.commit()
        db.refresh(material)
        return LessonMaterialResponse.model_validate(material)