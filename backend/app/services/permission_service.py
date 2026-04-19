from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.schemas.permission import PermissionCreate, PermissionUpdate, PermissionResponse


class PermissionService:

    @staticmethod
    def get_permissions(db: Session, page: int = 1, limit: int = 50) -> dict:
        total = db.query(func.count(Permission.id)).scalar()
        items = (
            db.query(Permission)
            .order_by(Permission.key.asc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return {
            "data": [PermissionResponse.model_validate(p) for p in items],
            "meta": {"page": page, "total": total, "limit": limit},
        }

    @staticmethod
    def create_permission(db: Session, payload: PermissionCreate) -> PermissionResponse:
        obj = Permission(**payload.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return PermissionResponse.model_validate(obj)

    @staticmethod
    def update_permission(db: Session, permission_id: int, payload: PermissionUpdate) -> PermissionResponse:
        obj = db.query(Permission).filter(Permission.id == permission_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Permission not found")
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        db.commit()
        db.refresh(obj)
        return PermissionResponse.model_validate(obj)

    @staticmethod
    def delete_permission(db: Session, permission_id: int) -> dict:
        obj = db.query(Permission).filter(Permission.id == permission_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Permission not found")
        db.delete(obj)
        db.commit()
        return {"detail": "Permission deleted"}

    @staticmethod
    def get_role_permissions(db: Session, role_id: int) -> list[int]:
        return [
            rp.permission_id
            for rp in db.query(RolePermission).filter(RolePermission.role_id == role_id).all()
        ]

    @staticmethod
    def set_role_permissions(db: Session, role_id: int, permission_ids: list[int]) -> dict:
        db.query(RolePermission).filter(RolePermission.role_id == role_id).delete()
        for permission_id in permission_ids:
            db.add(RolePermission(role_id=role_id, permission_id=permission_id))
        db.commit()
        return {"detail": "Role permissions updated"}
