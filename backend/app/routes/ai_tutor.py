from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.models.user import User
from app.services.ai_tutor_service import AITutorService
from app.schemas.ai_tutor import (
    AIChatRequest,
    AIChatResponse,
    AIMessageResponse,
)

ai_tutor_router = APIRouter(prefix="/lessons", tags=["AI Tutor"])


@ai_tutor_router.post("/{lesson_id}/tutor/chat", response_model=AIChatResponse)
def chat_with_tutor(
    lesson_id: int,
    payload: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard.get_current_user),
):
    """
    Send a message to the AI Tutor for a specific lesson.
    Checks quota and persists exchange in history.
    """
    response_text, quota_remaining, quota_limit = AITutorService.chat(
        db=db,
        student_id=current_user.id,
        lesson_id=lesson_id,
        prompt=payload.prompt,
    )
    return AIChatResponse(
        response=response_text,
        quota_remaining=quota_remaining,
        quota_limit=quota_limit,
    )


from fastapi.responses import StreamingResponse

@ai_tutor_router.post("/{lesson_id}/tutor/chat/stream")
def chat_with_tutor_stream(
    lesson_id: int,
    payload: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard.get_current_user),
):
    """
    Send a message to the AI Tutor for a specific lesson and stream response chunks.
    Checks quota and persists exchange in history.
    """
    return StreamingResponse(
        AITutorService.chat_stream(
            db=db,
            student_id=current_user.id,
            lesson_id=lesson_id,
            prompt=payload.prompt,
        ),
        media_type="text/event-stream"
    )


@ai_tutor_router.get("/{lesson_id}/tutor/history", response_model=List[AIMessageResponse])
def get_tutor_history(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard.get_current_user),
):
    """Get conversation history with the AI Tutor for a specific lesson."""
    return AITutorService.get_history(db=db, student_id=current_user.id, lesson_id=lesson_id)


@ai_tutor_router.get("/{lesson_id}/tutor/quota")
def get_tutor_quota(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard.get_current_user),
):
    """Get current day's AI Tutor message quota details."""
    quota_remaining, quota_limit = AITutorService.get_quota_info(db=db, student_id=current_user.id)
    return {"quota_remaining": quota_remaining, "quota_limit": quota_limit}


@ai_tutor_router.delete("/{lesson_id}/tutor/clear")
def clear_tutor_history(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard.get_current_user),
):
    """Reset the chat history with the AI Tutor for a specific lesson."""
    success = AITutorService.clear_history(db=db, student_id=current_user.id, lesson_id=lesson_id)
    return {"success": success}
