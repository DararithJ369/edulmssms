"""Tests for app.schemas.result — Result Pydantic schemas."""

from datetime import datetime

import pytest
from pydantic import ValidationError

from app.schemas.result import ResultBase, ResultCreate, ResultResponse, ResultUpdate


class TestResultBase:
    def test_valid_with_assignment(self):
        obj = ResultBase(
            student_id="stu-1",
            assignment_id=10,
            graded_by="teacher-1",
            score=85,
            total_marks=100,
        )
        assert obj.score == 85
        assert obj.is_passed is False  # default

    def test_valid_with_quiz(self):
        obj = ResultBase(
            student_id="stu-2",
            quiz_id=5,
            graded_by="t-1",
            score=45,
            total_marks=50,
            grade="A",
            is_passed=True,
        )
        assert obj.grade == "A"
        assert obj.is_passed is True

    def test_missing_student_id_raises(self):
        with pytest.raises(ValidationError):
            ResultBase(
                graded_by="t", score=10, total_marks=20
            )  # type: ignore[call-arg]


class TestResultCreate:
    def test_inherits_base(self):
        obj = ResultCreate(
            student_id="s1",
            exam_id=3,
            graded_by="g1",
            score=70,
            total_marks=100,
            feedback="Good work",
        )
        assert obj.feedback == "Good work"


class TestResultUpdate:
    def test_all_optional(self):
        obj = ResultUpdate()
        assert obj.score is None
        assert obj.grade is None

    def test_partial(self):
        obj = ResultUpdate(score=90, grade="A+", is_passed=True)
        assert obj.score == 90
        assert obj.is_passed is True


class TestResultResponse:
    def test_full(self):
        obj = ResultResponse(
            id=1,
            student_id="s1",
            assignment_id=10,
            graded_by="g1",
            score=80,
            total_marks=100,
            percentage=80.0,
            graded_at=datetime.utcnow(),
            student_name="Alice",
            grader_name="Prof. X",
            assessment_title="Midterm",
        )
        assert obj.percentage == 80.0
        assert obj.assessment_title == "Midterm"
