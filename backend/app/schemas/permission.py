from typing import Optional
from pydantic import BaseModel


class PermissionCreate(BaseModel):
    key: str
    description: Optional[str] = None
    is_active: Optional[bool] = True


class PermissionUpdate(BaseModel):
    key: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class PermissionResponse(BaseModel):
    id: int
    key: str
    description: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}
