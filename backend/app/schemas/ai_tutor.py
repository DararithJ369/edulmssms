from pydantic import BaseModel
from datetime import datetime
from typing import List


class AIMessageBase(BaseModel):
    sender: str  # "user" or "assistant"
    content: str


class AIMessageCreate(AIMessageBase):
    pass


class AIMessageResponse(AIMessageBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class AIConversationResponse(BaseModel):
    id: int
    student_id: str
    lesson_id: int
    created_at: datetime
    messages: List[AIMessageResponse] = []

    model_config = {"from_attributes": True}


class AIChatRequest(BaseModel):
    prompt: str


class AIChatResponse(BaseModel):
    response: str
    quota_remaining: int
    quota_limit: int
