from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.permission_service import PermissionService

role_permissions_router = APIRouter(prefix="/roles", tags=["Role Permissions"], dependencies=[Depends(PermissionGuard.admin_only)])


class RolePermissionsPayload(BaseModel):
    permission_ids: list[int]


@role_permissions_router.get("/{role_id}/permissions")
def get_role_permissions(role_id: int, db: Session = Depends(get_db)):
    return {"permission_ids": PermissionService.get_role_permissions(db, role_id)}


@role_permissions_router.put("/{role_id}/permissions")
def set_role_permissions(role_id: int, payload: RolePermissionsPayload, db: Session = Depends(get_db)):
    return PermissionService.set_role_permissions(db, role_id, payload.permission_ids)
