from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.announcement_service import AnnouncementService
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse
from app.models.user import User

announcement_router = APIRouter(prefix="/announcements", tags=["Announcements"])


@announcement_router.get("")
def get_all_announcements(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(PermissionGuard.get_current_user),
):
    return AnnouncementService.get_announcements(db, page, limit)


@announcement_router.get("/{announcement_id}", response_model=AnnouncementResponse)
def get_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(PermissionGuard.get_current_user),
):
    return AnnouncementService.get_announcement_by_id(db, announcement_id)


@announcement_router.post(
    "",
    response_model=AnnouncementResponse,
    dependencies=[Depends(PermissionGuard.admin_or_instructor)]
)
def create_announcement(
    payload: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user = Depends(PermissionGuard.get_current_user)
):
    return AnnouncementService.create_announcement(db, payload, str(current_user.id))


@announcement_router.put(
    "/{announcement_id}",
    response_model=AnnouncementResponse,
    dependencies=[Depends(PermissionGuard.admin_or_instructor)]
)
def update_announcement(
    announcement_id: int,
    payload: AnnouncementUpdate,
    db: Session = Depends(get_db)
):
    return AnnouncementService.update_announcement(db, announcement_id, payload)


@announcement_router.delete(
    "/{announcement_id}",
    dependencies=[Depends(PermissionGuard.admin_or_instructor)]
)
def delete_announcement(announcement_id: int, db: Session = Depends(get_db)):
    return AnnouncementService.delete_announcement(db, announcement_id)
