from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.event_service import EventService
from app.schemas.event import EventCreate, EventUpdate, EventResponse

event_router = APIRouter(prefix="/events", tags=["Events"])


@event_router.get("")
def get_all_events(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    return EventService.get_events(db, page, limit)


@event_router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    return EventService.get_event_by_id(db, event_id)


@event_router.post(
    "",
    response_model=EventResponse,
    dependencies=[Depends(PermissionGuard.admin_or_instructor)]
)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db)
):
    return EventService.create_event(db, payload)


@event_router.put(
    "/{event_id}",
    response_model=EventResponse,
    dependencies=[Depends(PermissionGuard.admin_or_instructor)]
)
def update_event(
    event_id: int,
    payload: EventUpdate,
    db: Session = Depends(get_db)
):
    return EventService.update_event(db, event_id, payload)


@event_router.delete(
    "/{event_id}",
    dependencies=[Depends(PermissionGuard.admin_or_instructor)]
)
def delete_event(event_id: int, db: Session = Depends(get_db)):
    return EventService.delete_event(db, event_id)
