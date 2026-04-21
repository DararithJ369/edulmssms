from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.permission_service import PermissionService
from app.schemas.permission import PermissionCreate, PermissionUpdate, PermissionResponse

permission_router = APIRouter(prefix="/permissions", tags=["Permissions"], dependencies=[Depends(PermissionGuard.admin_only)])


@permission_router.get("")
def get_permissions(page: int = 1, limit: int = 50, db: Session = Depends(get_db)):
    return PermissionService.get_permissions(db, page, limit)


@permission_router.post("", response_model=PermissionResponse)
def create_permission(payload: PermissionCreate, db: Session = Depends(get_db)):
    return PermissionService.create_permission(db, payload)


@permission_router.put("/{permission_id}", response_model=PermissionResponse)
def update_permission(permission_id: int, payload: PermissionUpdate, db: Session = Depends(get_db)):
    return PermissionService.update_permission(db, permission_id, payload)


@permission_router.delete("/{permission_id}")
def delete_permission(permission_id: int, db: Session = Depends(get_db)):
    return PermissionService.delete_permission(db, permission_id)
