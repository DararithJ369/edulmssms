from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, model_validator


class TermNested(BaseModel):
    id:         int
    name:       str
    start_date: date
    end_date:   date
    is_current: bool
    is_active:  bool

    model_config = {"from_attributes": True}


class AcademicYearCreate(BaseModel):
    name:       str                    # e.g. "2024-2025"
    start_date: date
    end_date:   date
    is_current: bool = False
    is_active:  bool = True

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        return self


class AcademicYearUpdate(BaseModel):
    name:       Optional[str]  = None
    start_date: Optional[date] = None
    end_date:   Optional[date] = None
    is_current: Optional[bool] = None
    is_active:  Optional[bool] = None


class AcademicYearResponse(BaseModel):
    id:         int
    name:       str
    start_date: date
    end_date:   date
    is_current: bool
    is_active:  bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    terms:      List[TermNested] = []

    model_config = {"from_attributes": True}