from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel, model_validator


class AcademicYearNested(BaseModel):
    id:   int
    name: str

    model_config = {"from_attributes": True}


class TermCreate(BaseModel):
    academic_year_id: int
    name:             str          # e.g. "Term 1", "Semester 2"
    start_date:       date
    end_date:         date
    is_current:       bool = False
    is_active:        bool = True

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        return self


class TermUpdate(BaseModel):
    name:       Optional[str]  = None
    start_date: Optional[date] = None
    end_date:   Optional[date] = None
    is_current: Optional[bool] = None
    is_active:  Optional[bool] = None


class TermResponse(BaseModel):
    id:               int
    academic_year_id: int
    academic_year:    Optional[AcademicYearNested] = None
    name:             str
    start_date:       date
    end_date:         date
    is_current:       bool
    is_active:        bool
    created_at:       Optional[datetime] = None
    updated_at:       Optional[datetime] = None

    model_config = {"from_attributes": True}