from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.role import Role
from app.schemas.role import RoleCreate, RoleUpdate, RoleResponse


class RoleService:

    @staticmethod
    def get_roles(db: Session, page: int = 1, limit: int = 10) -> dict:
        total = db.query(func.count(Role.id)).scalar()
        items = (
            db.query(Role)
            .order_by(Role.id.asc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return {
            "data": [RoleResponse.model_validate(r) for r in items],
            "meta": {"page": page, "total": total, "limit": limit},
        }

    @staticmethod
    def create_role(db: Session, payload: RoleCreate) -> RoleResponse:
        obj = Role(**payload.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return RoleResponse.model_validate(obj)

    @staticmethod
    def update_role(db: Session, role_id: int, payload: RoleUpdate) -> RoleResponse:
        obj = db.query(Role).filter(Role.id == role_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Role not found")
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        db.commit()
        db.refresh(obj)
        return RoleResponse.model_validate(obj)

    @staticmethod
    def delete_role(db: Session, role_id: int) -> dict:
        obj = db.query(Role).filter(Role.id == role_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Role not found")
        db.delete(obj)
        db.commit()
        return {"detail": "Role deleted"}
