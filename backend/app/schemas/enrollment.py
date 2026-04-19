from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel


class StudentProfileNested(BaseModel):
    id:         int
    student_id: Optional[str] = None  # e.g. STU2024001

    model_config = {"from_attributes": True}


class CourseNested(BaseModel):
    id:           int
    course_name:  str

    model_config = {"from_attributes": True}


class AcademicYearNested(BaseModel):
    id:   int
    name: str

    model_config = {"from_attributes": True}


class TermNested(BaseModel):
    id:   int
    name: str

    model_config = {"from_attributes": True}


class GradeLevelNested(BaseModel):
    id:   int
    name: str

    model_config = {"from_attributes": True}


class EnrollmentCreate(BaseModel):
    student_profile_id: int            # FK → student_profiles.id (carries student number)
    course_id:          int
    academic_year_id:   int
    term_id:            Optional[int]  = None
    grade_level_id:     Optional[int]  = None
    enrolled_date:      Optional[date] = None
    is_active:          bool           = True
    payment_status:     Optional[str]  = None
    payment_id:         Optional[str]  = None
    amount_paid:        Optional[float] = None


class EnrollmentCheckoutRequest(BaseModel):
    course_id:    int
    payment_id:   Optional[str]  = None
    amount_paid:  Optional[float] = 0
    term_id:      Optional[int]  = None


class EnrollmentUpdate(BaseModel):
    term_id:        Optional[int]  = None
    grade_level_id: Optional[int]  = None
    is_active:      Optional[bool] = None
    enrolled_date:  Optional[date] = None
    dropped_date:   Optional[date] = None
    payment_status: Optional[str]  = None
    payment_id:     Optional[str]  = None
    amount_paid:    Optional[float] = None


class EnrollmentResponse(BaseModel):
    id:                 int
    student_profile_id: int
    student_profile:    Optional[StudentProfileNested] = None
    course_id:          int
    course:             Optional[CourseNested]         = None
    academic_year_id:   int
    academic_year:      Optional[AcademicYearNested]   = None
    term_id:            Optional[int]                  = None
    term:               Optional[TermNested]           = None
    grade_level_id:     Optional[int]                  = None
    grade_level:        Optional[GradeLevelNested]     = None
    is_active:          bool
    enrolled_date:      Optional[date]                 = None
    dropped_date:       Optional[date]                 = None
    payment_status:     Optional[str]                  = None
    payment_id:         Optional[str]                  = None
    amount_paid:        Optional[float]                = None
    created_at:         Optional[datetime]             = None
    updated_at:         Optional[datetime]             = None

    model_config = {"from_attributes": True}