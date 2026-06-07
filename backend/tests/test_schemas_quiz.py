"""Tests for app.schemas.quiz — Quiz Pydantic schemas."""

from datetime import datetime

import pytest
from pydantic import ValidationError

from app.schemas.quiz import (
    QuizBase,
    QuizCreate,
    QuizOption,
    QuizOptionResponse,
    QuizQuestion,
    QuizQuestionResponse,
    QuizResponse,
    QuizSubmitPayload,
    QuizUpdate,
)


class TestQuizCreate:
    def test_valid(self):
        obj = QuizCreate(
            course_id=1,
            title="Week 1 Quiz",
            due_date=datetime(2025, 4, 15, 23, 59),
            instructor_id="inst-1",
        )
        assert obj.title == "Week 1 Quiz"
        assert obj.module_name is None

    def test_missing_title_raises(self):
        with pytest.raises(ValidationError):
            QuizCreate(
                course_id=1,
                due_date=datetime.utcnow(),
                instructor_id="i",
            )  # type: ignore[call-arg]


class TestQuizUpdate:
    def test_all_optional(self):
        obj = QuizUpdate()
        assert obj.title is None

    def test_partial(self):
        obj = QuizUpdate(title="Updated Quiz", lesson_id=5)
        assert obj.title == "Updated Quiz"


class TestQuizResponse:
    def test_full(self):
        obj = QuizResponse(
            id=1,
            course_id=1,
            title="Quiz 1",
            due_date=datetime.utcnow(),
            instructor_id="i1",
            created_at=datetime.utcnow(),
            course_name="Biology",
            questions=[
                QuizQuestionResponse(
                    id=1,
                    quiz_id=1,
                    question_text="What is DNA?",
                    options=[
                        QuizOptionResponse(id=1, question_id=1, option_text="A molecule"),
                        QuizOptionResponse(id=2, question_id=1, option_text="A protein"),
                    ],
                )
            ],
        )
        assert len(obj.questions) == 1
        assert len(obj.questions[0].options) == 2


class TestQuizSubmitPayload:
    def test_valid(self):
        obj = QuizSubmitPayload(answers={1: 3, 2: 5, 3: 7})
        assert obj.answers[1] == 3
        assert len(obj.answers) == 3

    def test_empty_answers(self):
        obj = QuizSubmitPayload(answers={})
        assert obj.answers == {}


class TestQuizOption:
    def test_valid(self):
        obj = QuizOption(id=1, question_id=1, option_text="Yes", is_correct=True)
        assert obj.is_correct is True


class TestQuizQuestion:
    def test_valid(self):
        obj = QuizQuestion(id=1, quiz_id=1, question_text="Why?")
        assert obj.options is None
