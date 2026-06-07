"""
Shared CRUD helpers that eliminate boiler-plate across service classes.

Usage example
-------------
    from app.services.base_service import get_or_404, paginate, apply_update, create_and_commit

    class EventService:
        @staticmethod
        def get_events(db, page=1, limit=10):
            return paginate(db, Event, EventResponse, Event.start_time.asc(), page, limit)

        @staticmethod
        def get_event_by_id(db, event_id):
            obj = get_or_404(db, Event, event_id, "Event")
            return EventResponse.model_validate(obj)

        @staticmethod
        def create_event(db, event_in):
            return create_and_commit(db, Event, event_in, EventResponse)

        @staticmethod
        def update_event(db, event_id, event_in):
            obj = get_or_404(db, Event, event_id, "Event")
            apply_update(obj, event_in)
            db.commit()
            db.refresh(obj)
            return EventResponse.model_validate(obj)

        @staticmethod
        def delete_event(db, event_id):
            return delete_and_commit(db, Event, event_id, "Event")
"""
from __future__ import annotations

from typing import Any, Optional, Type

from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session, Query


def get_or_404(db: Session, model: Type, entity_id: Any, entity_name: str) -> Any:
    """Fetch a single row by primary key or raise a 404."""
    obj = db.query(model).filter(model.id == entity_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail=f"{entity_name} not found")
    return obj


def paginate(
    db: Session,
    model: Type,
    response_schema: Type[BaseModel],
    order_by: Any,
    page: int = 1,
    limit: int = 10,
    query: Optional[Query] = None,
) -> dict:
    """Return a paginated ``{"data": [...], "meta": {...}}`` dict.

    Parameters
    ----------
    query : optional pre-built query (e.g. with filters already applied).
            When *None* a plain ``db.query(model)`` is used.
    """
    if query is None:
        query = db.query(model)

    total = query.with_entities(func.count(model.id)).scalar()
    rows = (
        query.order_by(order_by)
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return {
        "data": [response_schema.model_validate(r) for r in rows],
        "meta": {"page": page, "total": total, "limit": limit},
    }


def apply_update(obj: Any, schema: BaseModel, *, exclude: Optional[set] = None) -> None:
    """Apply non-null fields from *schema* onto an ORM object."""
    exclude = exclude or set()
    for field, value in schema.model_dump(exclude_unset=True, exclude=exclude).items():
        setattr(obj, field, value)


def create_and_commit(
    db: Session,
    model: Type,
    schema: BaseModel,
    response_schema: Type[BaseModel],
    *,
    exclude: Optional[set] = None,
) -> BaseModel:
    """Create a row from *schema*, commit, and return the response DTO."""
    data = schema.model_dump(exclude=exclude) if exclude else schema.model_dump()
    obj = model(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return response_schema.model_validate(obj)


def delete_and_commit(db: Session, model: Type, entity_id: Any, entity_name: str) -> dict:
    """Delete a row by primary key or raise a 404."""
    obj = get_or_404(db, model, entity_id, entity_name)
    db.delete(obj)
    db.commit()
    return {"detail": f"{entity_name} deleted successfully"}
