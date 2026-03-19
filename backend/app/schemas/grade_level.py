from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class GradeLevelCreate(BaseModel):
    name:        str
    code:        Optional[str] = None
    description: Optional[str] = None
    order:       int  = 0
    is_active:   bool = True


class GradeLevelUpdate(BaseModel):
    name:        Optional[str]  = None
    code:        Optional[str]  = None
    description: Optional[str]  = None
    order:       Optional[int]  = None
    is_active:   Optional[bool] = None


class GradeLevelResponse(BaseModel):
    id:          int
    name:        str
    code:        Optional[str] = None
    description: Optional[str] = None
    order:       int
    is_active:   bool
    created_at:  Optional[datetime] = None
    updated_at:  Optional[datetime] = None

    model_config = {"from_attributes": True}