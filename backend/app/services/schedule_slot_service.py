from datetime import date, datetime
from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.schedule_slot import ScheduleSlot
from app.models.class_session import ClassSession
from app.models.class_ import Class
from app.models.user import User
from app.models.subject import Subject
from app.schemas.schedule_slot import ScheduleSlotCreate, ScheduleSlotUpdate, ScheduleSlotResponse


class ScheduleSlotService:

    @staticmethod
    def get_slots(
        db: Session,
        page: int = 1,
        limit: int = 10,
        class_id: Optional[int] = None,
        teacher_id: Optional[str] = None,
        room: Optional[str] = None,
    ) -> dict:
        query = db.query(ScheduleSlot)
        if class_id is not None:
            query = query.filter(ScheduleSlot.class_id == class_id)
        if teacher_id is not None:
            query = query.filter(ScheduleSlot.teacher_id == teacher_id)
        if room is not None:
            query = query.filter(ScheduleSlot.room == room)

        total = query.with_entities(func.count(ScheduleSlot.id)).scalar()
        slots = (
            query.order_by(ScheduleSlot.day_of_week, ScheduleSlot.start_time)
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )

        response_data = []
        for s in slots:
            resp = ScheduleSlotResponse.model_validate(s)
            resp.class_name = s.class_.name if s.class_ else f"Class #{s.class_id}"
            resp.subject_name = s.subject.name if s.subject else f"Subject #{s.subject_id}"
            resp.teacher_name = (
                s.teacher.profile.full_name or s.teacher.username
                if s.teacher and s.teacher.profile
                else (s.teacher.username if s.teacher else f"Teacher #{s.teacher_id[:8]}")
            )
            response_data.append(resp)

        return {
            "data": response_data,
            "meta": {"page": page, "total": total, "limit": limit},
        }

    @staticmethod
    def get_slot_by_id(db: Session, slot_id: int) -> ScheduleSlotResponse:
        s = db.query(ScheduleSlot).filter(ScheduleSlot.id == slot_id).first()
        if not s:
            raise HTTPException(status_code=404, detail="Schedule slot not found")
        
        resp = ScheduleSlotResponse.model_validate(s)
        resp.class_name = s.class_.name if s.class_ else f"Class #{s.class_id}"
        resp.subject_name = s.subject.name if s.subject else f"Subject #{s.subject_id}"
        resp.teacher_name = (
            s.teacher.profile.full_name or s.teacher.username
            if s.teacher and s.teacher.profile
            else (s.teacher.username if s.teacher else f"Teacher #{s.teacher_id[:8]}")
        )
        return resp

    @staticmethod
    def check_conflicts(
        db: Session,
        class_id: int,
        teacher_id: str,
        subject_id: int,
        day_of_week: str,
        start_time,
        end_time,
        room: Optional[str] = None,
        exclude_slot_id: Optional[int] = None,
    ):
        day = day_of_week.upper()
        
        # 1. Lecturer conflict
        query_teacher = db.query(ScheduleSlot).filter(
            ScheduleSlot.teacher_id == teacher_id,
            ScheduleSlot.day_of_week == day,
            ScheduleSlot.is_active == True,
            ScheduleSlot.start_time < end_time,
            ScheduleSlot.end_time > start_time,
        )
        if exclude_slot_id:
            query_teacher = query_teacher.filter(ScheduleSlot.id != exclude_slot_id)
        conflict_teacher = query_teacher.first()
        if conflict_teacher:
            teacher_name = (
                conflict_teacher.teacher.profile.full_name or conflict_teacher.teacher.username
                if conflict_teacher.teacher and conflict_teacher.teacher.profile
                else conflict_teacher.teacher.username
            )
            raise HTTPException(
                status_code=400,
                detail=f"Lecturer Conflict: {teacher_name} is already scheduled on {day} from {conflict_teacher.start_time} to {conflict_teacher.end_time} (Slot #{conflict_teacher.id})"
            )

        # 2. Room conflict
        if room:
            query_room = db.query(ScheduleSlot).filter(
                ScheduleSlot.room == room,
                ScheduleSlot.day_of_week == day,
                ScheduleSlot.is_active == True,
                ScheduleSlot.start_time < end_time,
                ScheduleSlot.end_time > start_time,
            )
            if exclude_slot_id:
                query_room = query_room.filter(ScheduleSlot.id != exclude_slot_id)
            conflict_room = query_room.first()
            if conflict_room:
                raise HTTPException(
                    status_code=400,
                    detail=f"Room Conflict: Room {room} is already booked on {day} from {conflict_room.start_time} to {conflict_room.end_time} (Slot #{conflict_room.id})"
                )

        # 3. Class conflict
        query_class = db.query(ScheduleSlot).filter(
            ScheduleSlot.class_id == class_id,
            ScheduleSlot.day_of_week == day,
            ScheduleSlot.is_active == True,
            ScheduleSlot.start_time < end_time,
            ScheduleSlot.end_time > start_time,
        )
        if exclude_slot_id:
            query_class = query_class.filter(ScheduleSlot.id != exclude_slot_id)
        conflict_class = query_class.first()
        if conflict_class:
            class_name = conflict_class.class_.name if conflict_class.class_ else f"Class #{class_id}"
            raise HTTPException(
                status_code=400,
                detail=f"Class Timetable Conflict: {class_name} already has a slot scheduled on {day} from {conflict_class.start_time} to {conflict_class.end_time} (Slot #{conflict_class.id})"
            )

    @staticmethod
    def create_slot(db: Session, slot_in: ScheduleSlotCreate) -> ScheduleSlotResponse:
        # Check integrity
        if not db.query(Class).filter(Class.id == slot_in.class_id).first():
            raise HTTPException(status_code=404, detail="Class not found")
        if not db.query(User).filter(User.id == slot_in.teacher_id).first():
            raise HTTPException(status_code=404, detail="Lecturer not found")
        if not db.query(Subject).filter(Subject.id == slot_in.subject_id).first():
            raise HTTPException(status_code=404, detail="Subject not found")

        # Run conflict checks
        ScheduleSlotService.check_conflicts(
            db=db,
            class_id=slot_in.class_id,
            teacher_id=slot_in.teacher_id,
            subject_id=slot_in.subject_id,
            day_of_week=slot_in.day_of_week,
            start_time=slot_in.start_time,
            end_time=slot_in.end_time,
            room=slot_in.room,
        )

        obj = ScheduleSlot(**slot_in.model_dump())
        obj.day_of_week = obj.day_of_week.upper()
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return ScheduleSlotService.get_slot_by_id(db, obj.id)

    @staticmethod
    def update_slot(db: Session, slot_id: int, slot_in: ScheduleSlotUpdate) -> ScheduleSlotResponse:
        obj = db.query(ScheduleSlot).filter(ScheduleSlot.id == slot_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Schedule slot not found")

        update_data = slot_in.model_dump(exclude_unset=True)
        
        # Merge properties to check conflict with updated state
        c_id = update_data.get("class_id", obj.class_id)
        t_id = update_data.get("teacher_id", obj.teacher_id)
        s_id = update_data.get("subject_id", obj.subject_id)
        day = update_data.get("day_of_week", obj.day_of_week)
        start = update_data.get("start_time", obj.start_time)
        end = update_data.get("end_time", obj.end_time)
        rm = update_data.get("room", obj.room)

        # Run conflict checks excluding current slot
        ScheduleSlotService.check_conflicts(
            db=db,
            class_id=c_id,
            teacher_id=t_id,
            subject_id=s_id,
            day_of_week=day,
            start_time=start,
            end_time=end,
            room=rm,
            exclude_slot_id=slot_id,
        )

        for field, value in update_data.items():
            if field == "day_of_week" and value:
                value = value.upper()
            setattr(obj, field, value)

        db.commit()
        db.refresh(obj)
        return ScheduleSlotService.get_slot_by_id(db, obj.id)

    @staticmethod
    def delete_slot(db: Session, slot_id: int) -> dict:
        obj = db.query(ScheduleSlot).filter(ScheduleSlot.id == slot_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Schedule slot not found")
        db.delete(obj)
        db.commit()
        return {"detail": "Schedule slot deleted successfully"}

    @staticmethod
    def generate_sessions(
        db: Session,
        start_date: date,
        end_date: date,
        class_id: Optional[int] = None,
    ) -> dict:
        # Load active schedule slots
        query = db.query(ScheduleSlot).filter(ScheduleSlot.is_active == True)
        if class_id is not None:
            query = query.filter(ScheduleSlot.class_id == class_id)
        slots = query.all()

        if not slots:
            return {"detail": "No active schedule slots found to generate sessions.", "created_count": 0}

        import datetime as dt
        generated_count = 0
        current_day = start_date

        while current_day <= end_date:
            weekday_name = current_day.strftime("%A").upper()  # MONDAY, TUESDAY, etc.
            
            # Find matching slots
            matching_slots = [s for s in slots if s.day_of_week == weekday_name]
            for s in matching_slots:
                # Check if session already exists for this slot, class, and date
                existing = db.query(ClassSession).filter(
                    ClassSession.class_id == s.class_id,
                    ClassSession.subject_id == s.subject_id,
                    ClassSession.date == current_day,
                    ClassSession.start_time == s.start_time,
                ).first()

                if not existing:
                    # Resolve class/subject title
                    subj_name = s.subject.name if s.subject else "Class Session"
                    session = ClassSession(
                        class_id=s.class_id,
                        subject_id=s.subject_id,
                        teacher_id=s.teacher_id,
                        schedule_slot_id=s.id,
                        title=f"{subj_name} Lecture",
                        description=f"Weekly scheduled session generated automatically.",
                        date=current_day,
                        start_time=s.start_time,
                        end_time=s.end_time,
                        room=s.room,
                        status="scheduled"
                    )
                    db.add(session)
                    generated_count += 1

            current_day += dt.timedelta(days=1)

        db.commit()
        return {
            "detail": f"Successfully generated {generated_count} class sessions from slots.",
            "created_count": generated_count
        }
