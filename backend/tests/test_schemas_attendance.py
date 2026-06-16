"""Tests for app.schemas.attendance — Attendance Pydantic schemas."""

from datetime import date, datetime

import pytest
from pydantic import ValidationError

from app.schemas.attendance import (
    AttendanceBulkCreate,
    AttendanceCreate,
    AttendanceRecord,
    AttendanceResponse,
    AttendanceUpdate,
    attendanceBase,
)


class TestAttendanceBase:
    def test_valid(self):
        obj = attendanceBase(
            student_id="stu-1",
            course_id=10,
            date=date(2025, 3, 15),
            status="present",
        )
        assert obj.status == "present"
        assert obj.session_id is None

    def test_missing_required_raises(self):
        with pytest.raises(ValidationError):
            attendanceBase(student_id="stu-1", date=date.today())  # type: ignore[call-arg]


class TestAttendanceCreate:
    def test_inherits_base(self):
        obj = AttendanceCreate(
            student_id="s1",
            course_id=1,
            date=date.today(),
            status="late",
            time="09:15 AM",
        )
        assert obj.time == "09:15 AM"


class TestAttendanceUpdate:
    def test_all_optional(self):
        obj = AttendanceUpdate()
        assert obj.status is None
        assert obj.note is None

    def test_partial(self):
        obj = AttendanceUpdate(status="absent", note="sick")
        assert obj.status == "absent"


class TestAttendanceResponse:
    def test_full(self):
        obj = AttendanceResponse(
            id=1,
            student_id="s1",
            course_id=1,
            date=date.today(),
            status="present",
            recorded_by="teacher-1",
            created_at=datetime.utcnow(),
            student_name="Alice",
            course_name="Math",
        )
        assert obj.recorded_by == "teacher-1"
        assert obj.student_name == "Alice"


class TestAttendanceRecord:
    def test_minimal(self):
        obj = AttendanceRecord(student_id="s1", status="present")
        assert obj.time is None

    def test_with_note(self):
        obj = AttendanceRecord(student_id="s1", status="late", note="traffic")
        assert obj.note == "traffic"


class TestAttendanceBulkCreate:
    def test_valid(self):
        obj = AttendanceBulkCreate(
            course_id=5,
            date=date(2025, 4, 1),
            attendance=[
                AttendanceRecord(student_id="s1", status="present"),
                AttendanceRecord(student_id="s2", status="absent"),
            ],
        )
        assert len(obj.attendance) == 2

    def test_empty_attendance_list(self):
        obj = AttendanceBulkCreate(course_id=5, date=date.today(), attendance=[])
        assert obj.attendance == []
