"""Tests for app.schemas.course — Course / Module / Lesson Pydantic schemas."""

from datetime import datetime

import pytest
from pydantic import ValidationError

from app.schemas.course import (
    CourseBase,
    CourseCreate,
    CourseUpdate,
    LessonCreate,
    LessonResponse,
    ModuleCreate,
    ModuleResponse,
)


class TestLessonCreate:
    def test_minimal(self):
        obj = LessonCreate(title="Intro", order=1)
        assert obj.title == "Intro"
        assert obj.duration == "0min"
        assert obj.material_type == "article"

    def test_full(self):
        obj = LessonCreate(
            title="Advanced",
            description="Deep dive",
            content="<p>Hello</p>",
            duration="45min",
            material_type="video",
            material_url="https://example.com/vid.mp4",
            order=2,
        )
        assert obj.material_url == "https://example.com/vid.mp4"

    def test_missing_title_raises(self):
        with pytest.raises(ValidationError):
            LessonCreate(order=1)  # type: ignore[call-arg]

    def test_missing_order_raises(self):
        with pytest.raises(ValidationError):
            LessonCreate(title="No order")  # type: ignore[call-arg]


class TestModuleCreate:
    def test_minimal(self):
        obj = ModuleCreate(title="Module 1", order=1)
        assert obj.lessons == []

    def test_with_nested_lessons(self):
        obj = ModuleCreate(
            title="Module 2",
            order=2,
            lessons=[
                LessonCreate(title="L1", order=1),
                LessonCreate(title="L2", order=2),
            ],
        )
        assert len(obj.lessons) == 2


class TestCourseCreate:
    def test_minimal(self):
        obj = CourseCreate(course_name="Python 101", course_code="PY101")
        assert obj.difficulty == "beginner"
        assert obj.modules == []

    def test_with_modules(self):
        obj = CourseCreate(
            course_name="Data Science",
            course_code="DS200",
            modules=[ModuleCreate(title="Mod1", order=1)],
        )
        assert len(obj.modules) == 1

    def test_missing_course_name_raises(self):
        with pytest.raises(ValidationError):
            CourseCreate(course_code="X")  # type: ignore[call-arg]


class TestCourseUpdate:
    def test_all_optional(self):
        obj = CourseUpdate()
        assert obj.course_name is None
        assert obj.difficulty is None

    def test_partial(self):
        obj = CourseUpdate(course_name="New Name", price=29.99)
        assert obj.course_name == "New Name"
        assert obj.price == 29.99


class TestLessonResponse:
    def test_from_dict(self):
        now = datetime.utcnow()
        obj = LessonResponse(
            id=1,
            module_id=10,
            title="Lesson 1",
            duration="30min",
            material_type="article",
            order=1,
            created_at=now,
        )
        assert obj.id == 1


class TestModuleResponse:
    def test_from_dict(self):
        now = datetime.utcnow()
        obj = ModuleResponse(
            id=1,
            course_id=5,
            title="Module A",
            order=1,
            created_at=now,
        )
        assert obj.lessons == []
