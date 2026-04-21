from typing import Optional
from pydantic import BaseModel


class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    
    
class RoleCreate(RoleBase):
    pass


class RoleUpdate(RoleBase):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class Role(RoleBase):
    id: int
    is_active: bool
    
    model_config = {"from_attributes": True}


class RoleResponse(Role):
    pass