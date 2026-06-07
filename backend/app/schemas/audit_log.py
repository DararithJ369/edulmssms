from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class UserBriefResponse(BaseModel):
    id: str
    username: str
    email: str

    model_config = {"from_attributes": True}


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[str] = None
    action: str
    message: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime
    user: Optional[UserBriefResponse] = None

    model_config = {"from_attributes": True}
