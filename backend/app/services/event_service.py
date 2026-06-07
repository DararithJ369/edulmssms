from sqlalchemy.orm import Session
from app.models.event import Event
from app.schemas.event import EventCreate, EventUpdate, EventResponse
from app.services.base_service import get_or_404, paginate, apply_update, create_and_commit, delete_and_commit


class EventService:

    @staticmethod
    def get_events(db: Session, page: int = 1, limit: int = 100) -> dict:
        return paginate(db, Event, EventResponse, Event.start_time.asc(), page, limit)

    @staticmethod
    def get_event_by_id(db: Session, event_id: int) -> EventResponse:
        obj = get_or_404(db, Event, event_id, "Event")
        return EventResponse.model_validate(obj)

    @staticmethod
    def create_event(db: Session, event_in: EventCreate) -> EventResponse:
        return create_and_commit(db, Event, event_in, EventResponse)

    @staticmethod
    def update_event(
        db: Session, event_id: int, event_in: EventUpdate
    ) -> EventResponse:
        obj = get_or_404(db, Event, event_id, "Event")
        apply_update(obj, event_in)
        db.commit()
        db.refresh(obj)
        return EventResponse.model_validate(obj)

    @staticmethod
    def delete_event(db: Session, event_id: int) -> dict:
        return delete_and_commit(db, Event, event_id, "Event")
