"""Tests for app.schemas.enrollment — Enrollment Pydantic schemas."""

from datetime import date, datetime

import pytest
from pydantic import ValidationError

from app.schemas.enrollment import (
    AcademicYearNested,
    CourseNested,
    EnrollmentCheckoutRequest,
    EnrollmentCreate,
    EnrollmentResponse,
    EnrollmentUpdate,
    GradeLevelNested,
    StudentProfileNested,
    TermNested,
)


class TestEnrollmentCreate:
    def test_valid_minimal(self):
        obj = EnrollmentCreate(
            student_profile_id=1,
            course_id=10,
            academic_year_id=2,
        )
        assert obj.is_active is True
        assert obj.enrolled_date is None

    def test_full(self):
        obj = EnrollmentCreate(
            student_profile_id=1,
            course_id=10,
            academic_year_id=2,
            term_id=1,
            grade_level_id=3,
            enrolled_date=date(2025, 1, 15),
            is_active=True,
        )
        assert obj.enrolled_date == date(2025, 1, 15)

    def test_missing_required_raises(self):
        with pytest.raises(ValidationError):
            EnrollmentCreate(course_id=10)  # type: ignore[call-arg]


class TestEnrollmentCheckoutRequest:
    def test_valid(self):
        obj = EnrollmentCheckoutRequest(course_id=5)
        assert obj.term_id is None

    def test_with_term(self):
        obj = EnrollmentCheckoutRequest(course_id=5, term_id=2)
        assert obj.term_id == 2


class TestEnrollmentUpdate:
    def test_all_optional(self):
        obj = EnrollmentUpdate()
        assert obj.is_active is None
        assert obj.dropped_date is None

    def test_partial(self):
        obj = EnrollmentUpdate(is_active=False, dropped_date=date(2025, 5, 1))
        assert obj.is_active is False


class TestEnrollmentResponse:
    def test_minimal(self):
        obj = EnrollmentResponse(
            id=1,
            student_profile_id=10,
            course_id=5,
            academic_year_id=2,
            is_active=True,
        )
        assert obj.student_profile is None
        assert obj.course is None

    def test_with_nested(self):
        obj = EnrollmentResponse(
            id=1,
            student_profile_id=10,
            student_profile=StudentProfileNested(id=10, student_id="STU001"),
            course_id=5,
            course=CourseNested(id=5, course_name="Math 101"),
            academic_year_id=2,
            academic_year=AcademicYearNested(id=2, name="2024-2025"),
            term_id=1,
            term=TermNested(id=1, name="Fall"),
            grade_level_id=3,
            grade_level=GradeLevelNested(id=3, name="Grade 10"),
            is_active=True,
        )
        assert obj.student_profile.student_id == "STU001"
        assert obj.course.course_name == "Math 101"
        assert obj.grade_level.name == "Grade 10"


class TestNestedModels:
    def test_student_profile_nested(self):
        obj = StudentProfileNested(id=1)
        assert obj.student_id is None

    def test_course_nested(self):
        obj = CourseNested(id=1, course_name="CS101")
        assert obj.course_name == "CS101"
