from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.grade_level import GradeLevel
from app.schemas.grade_level import GradeLevelCreate, GradeLevelUpdate, GradeLevelResponse


class GradeLevelService:

    @staticmethod
    def get_grade_levels(db: Session, page: int = 1, limit: int = 10) -> dict:
        total = db.query(func.count(GradeLevel.id)).scalar()
        levels = (
            db.query(GradeLevel)
            .order_by(GradeLevel.order.asc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return {
            "data": [GradeLevelResponse.model_validate(l) for l in levels],
            "meta": {"page": page, "total": total, "limit": limit},
        }

    @staticmethod
    def get_grade_level_by_id(db: Session, level_id: int) -> GradeLevelResponse:
        obj = db.query(GradeLevel).filter(GradeLevel.id == level_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Grade level not found")
        return GradeLevelResponse.model_validate(obj)

    @staticmethod
    def setup_form(db: Session) -> dict:
        return {
            "fields": {
                "name":        {"type": "string",  "required": True, "hint": "e.g. Grade 1, Year 10"},
                "code":        {"type": "string",  "required": False, "hint": "e.g. G1, Y10"},
                "description": {"type": "text",    "required": False},
                "order":       {"type": "number",  "required": True, "hint": "Sort order (1, 2, 3...)"},
                "is_active":   {"type": "boolean", "required": False},
            }
        }

    @staticmethod
    def create_grade_level(db: Session, level_in: GradeLevelCreate) -> GradeLevelResponse:
        if db.query(GradeLevel).filter(GradeLevel.name == level_in.name).first():
            raise HTTPException(status_code=400, detail="Grade level name already exists")
        if level_in.code:
            if db.query(GradeLevel).filter(GradeLevel.code == level_in.code).first():
                raise HTTPException(status_code=400, detail="Grade level code already exists")
        obj = GradeLevel(**level_in.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return GradeLevelResponse.model_validate(obj)

    @staticmethod
    def update_grade_level(
        db: Session, level_id: int, level_in: GradeLevelUpdate
    ) -> GradeLevelResponse:
        obj = db.query(GradeLevel).filter(GradeLevel.id == level_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Grade level not found")

        if level_in.name:
            conflict = db.query(GradeLevel).filter(
                GradeLevel.name == level_in.name, GradeLevel.id != level_id
            ).first()
            if conflict:
                raise HTTPException(status_code=400, detail="Grade level name already exists")

        if level_in.code:
            conflict = db.query(GradeLevel).filter(
                GradeLevel.code == level_in.code, GradeLevel.id != level_id
            ).first()
            if conflict:
                raise HTTPException(status_code=400, detail="Grade level code already exists")

        for field, value in level_in.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)

        db.commit()
        db.refresh(obj)
        return GradeLevelResponse.model_validate(obj)

    @staticmethod
    def delete_grade_level(db: Session, level_id: int) -> dict:
        obj = db.query(GradeLevel).filter(GradeLevel.id == level_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Grade level not found")
        if obj.classes:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete grade level with existing classes",
            )
        db.delete(obj)
        db.commit()
        return {"detail": "Grade level deleted successfully"}

    @staticmethod
    def get_grade_level_classes(db: Session, level_id: int) -> list:
        obj = db.query(GradeLevel).filter(GradeLevel.id == level_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Grade level not found")
        from app.schemas.class_ import ClassResponse
        return [ClassResponse.model_validate(c) for c in obj.classes]