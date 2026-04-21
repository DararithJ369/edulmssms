from pydantic import BaseModel
from typing import Any, List


class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    data: List[Any]