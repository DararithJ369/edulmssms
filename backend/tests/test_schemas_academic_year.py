"""Tests for app.schemas.academic_year — AcademicYear Pydantic schemas."""

from datetime import date, datetime

import pytest
from pydantic import ValidationError

from app.schemas.academic_year import (
    AcademicYearCreate,
    AcademicYearResponse,
    AcademicYearUpdate,
    TermNested,
)


class TestAcademicYearCreate:
    def test_valid_creation(self):
        obj = AcademicYearCreate(
            name="2024-2025",
            start_date=date(2024, 9, 1),
            end_date=date(2025, 6, 30),
        )
        assert obj.name == "2024-2025"
        assert obj.is_current is False
        assert obj.is_active is True

    def test_end_before_start_raises(self):
        with pytest.raises(ValidationError, match="end_date must be after start_date"):
            AcademicYearCreate(
                name="bad",
                start_date=date(2025, 6, 30),
                end_date=date(2024, 9, 1),
            )

    def test_same_start_and_end_raises(self):
        with pytest.raises(ValidationError, match="end_date must be after start_date"):
            AcademicYearCreate(
                name="bad",
                start_date=date(2025, 1, 1),
                end_date=date(2025, 1, 1),
            )

    def test_missing_required_fields_raises(self):
        with pytest.raises(ValidationError):
            AcademicYearCreate()  # type: ignore[call-arg]


class TestAcademicYearUpdate:
    def test_all_optional(self):
        obj = AcademicYearUpdate()
        assert obj.name is None
        assert obj.start_date is None

    def test_partial_update(self):
        obj = AcademicYearUpdate(name="2025-2026", is_current=True)
        assert obj.name == "2025-2026"
        assert obj.is_current is True
        assert obj.end_date is None


class TestAcademicYearResponse:
    def test_full_response(self):
        obj = AcademicYearResponse(
            id=1,
            name="2024-2025",
            start_date=date(2024, 9, 1),
            end_date=date(2025, 6, 30),
            is_current=True,
            is_active=True,
            terms=[
                TermNested(
                    id=1,
                    name="Fall",
                    start_date=date(2024, 9, 1),
                    end_date=date(2024, 12, 20),
                    is_current=True,
                    is_active=True,
                )
            ],
        )
        assert obj.id == 1
        assert len(obj.terms) == 1
        assert obj.terms[0].name == "Fall"

    def test_empty_terms_default(self):
        obj = AcademicYearResponse(
            id=2,
            name="2025-2026",
            start_date=date(2025, 9, 1),
            end_date=date(2026, 6, 30),
            is_current=False,
            is_active=True,
        )
        assert obj.terms == []


class TestTermNested:
    def test_valid(self):
        t = TermNested(
            id=1,
            name="Spring",
            start_date=date(2025, 1, 10),
            end_date=date(2025, 5, 30),
            is_current=False,
            is_active=True,
        )
        assert t.name == "Spring"
