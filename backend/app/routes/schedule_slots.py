from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.schedule_slot_service import ScheduleSlotService
from app.schemas.schedule_slot import ScheduleSlotCreate, ScheduleSlotUpdate, ScheduleSlotResponse

schedule_slot_router = APIRouter(prefix="/schedule-slots", tags=["Schedule Slots"])


@schedule_slot_router.get("")
def get_slots(
    page: int = 1,
    limit: int = 10,
    class_id: Optional[int] = Query(None),
    teacher_id: Optional[str] = Query(None),
    room: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return ScheduleSlotService.get_slots(db, page, limit, class_id, teacher_id, room)


@schedule_slot_router.post("/generate-sessions", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def generate_sessions(
    start_date: date = Query(...),
    end_date: date = Query(...),
    class_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Start date must be before or equal to end date.")
    return ScheduleSlotService.generate_sessions(db, start_date, end_date, class_id)


@schedule_slot_router.get("/{slot_id}", response_model=ScheduleSlotResponse)
def get_slot(slot_id: int, db: Session = Depends(get_db)):
    return ScheduleSlotService.get_slot_by_id(db, slot_id)


@schedule_slot_router.post("", response_model=ScheduleSlotResponse, dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def create_slot(payload: ScheduleSlotCreate, db: Session = Depends(get_db)):
    return ScheduleSlotService.create_slot(db, payload)


@schedule_slot_router.put("/{slot_id}", response_model=ScheduleSlotResponse, dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def update_slot(slot_id: int, payload: ScheduleSlotUpdate, db: Session = Depends(get_db)):
    return ScheduleSlotService.update_slot(db, slot_id, payload)


@schedule_slot_router.delete("/{slot_id}", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def delete_slot(slot_id: int, db: Session = Depends(get_db)):
    return ScheduleSlotService.delete_slot(db, slot_id)
