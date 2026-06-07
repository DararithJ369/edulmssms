from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.event import Event
from app.schemas.event import EventCreate, EventUpdate, EventResponse


class EventService:

    @staticmethod
    def get_events(db: Session, page: int = 1, limit: int = 100) -> dict:
        total = db.query(func.count(Event.id)).scalar()
        events = (
            db.query(Event)
            .order_by(Event.start_time.asc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return {
            "data": [EventResponse.model_validate(e) for e in events],
            "meta": {"page": page, "total": total, "limit": limit},
        }

    @staticmethod
    def get_event_by_id(db: Session, event_id: int) -> EventResponse:
        obj = db.query(Event).filter(Event.id == event_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Event not found")
        return EventResponse.model_validate(obj)

    @staticmethod
    def create_event(db: Session, event_in: EventCreate) -> EventResponse:
        obj = Event(**event_in.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return EventResponse.model_validate(obj)

    @staticmethod
    def update_event(
        db: Session, event_id: int, event_in: EventUpdate
    ) -> EventResponse:
        obj = db.query(Event).filter(Event.id == event_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Event not found")

        for field, value in event_in.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)

        db.commit()
        db.refresh(obj)
        return EventResponse.model_validate(obj)

    @staticmethod
    def delete_event(db: Session, event_id: int) -> dict:
        obj = db.query(Event).filter(Event.id == event_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Event not found")
        db.delete(obj)
        db.commit()
        return {"detail": "Event deleted successfully"}
