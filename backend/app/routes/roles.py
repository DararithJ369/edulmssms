from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.role_service import RoleService
from app.schemas.role import RoleCreate, RoleUpdate, RoleResponse

role_router = APIRouter(prefix="/roles", tags=["Roles"], dependencies=[Depends(PermissionGuard.admin_only)])


@role_router.get("")
def get_roles(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    return RoleService.get_roles(db, page, limit)


@role_router.post("", response_model=RoleResponse)
def create_role(payload: RoleCreate, db: Session = Depends(get_db)):
    return RoleService.create_role(db, payload)


@role_router.put("/{role_id}", response_model=RoleResponse)
def update_role(role_id: int, payload: RoleUpdate, db: Session = Depends(get_db)):
    return RoleService.update_role(db, role_id, payload)


@role_router.delete("/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db)):
    return RoleService.delete_role(db, role_id)
