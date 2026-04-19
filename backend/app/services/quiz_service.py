from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.quiz import Quiz, QuizQuestion, QuizOption
from app.models.result import Result
from app.schemas.quiz import QuizCreate, QuizUpdate, QuizResponse, QuizSubmitPayload
from app.schemas.result import ResultResponse


class QuizService:

    @staticmethod
    def get_quizzes(db: Session, page: int = 1, limit: int = 10, search: str = "") -> dict:
        query = db.query(Quiz)
        
        if search:
            query = query.filter(
                (Quiz.title.ilike(f"%{search}%")) |
                (Quiz.description.ilike(f"%{search}%")) |
                (Quiz.module_name.ilike(f"%{search}%"))
            )
        
        total = query.with_entities(func.count(Quiz.id)).scalar()
        quizzes = (
            query.order_by(Quiz.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return {
            "data": [QuizResponse.model_validate(q) for q in quizzes],
            "meta": {"page": page, "total": total, "limit": limit},
        }

    @staticmethod
    def get_quiz_by_id(db: Session, quiz_id: int) -> QuizResponse:
        obj = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Quiz not found")
        return QuizResponse.model_validate(obj)

    @staticmethod
    def create_quiz(db: Session, quiz_in: QuizCreate) -> QuizResponse:
        data = quiz_in.model_dump(exclude={"questions"})
        obj = Quiz(**data)
        db.add(obj)
        db.flush()

        for q in (quiz_in.questions or []):
            options = q.pop("options", []) if isinstance(q, dict) else getattr(q, "options", [])
            question_data = q if isinstance(q, dict) else q.model_dump(exclude={"options"})
            question = QuizQuestion(quiz_id=obj.id, **question_data)
            db.add(question)
            db.flush()
            for opt in options:
                opt_data = opt if isinstance(opt, dict) else opt.model_dump()
                db.add(QuizOption(question_id=question.id, **opt_data))

        db.commit()
        db.refresh(obj)
        return QuizResponse.model_validate(obj)

    @staticmethod
    def update_quiz(db: Session, quiz_id: int, quiz_in: QuizUpdate) -> QuizResponse:
        obj = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Quiz not found")
        for field, value in quiz_in.model_dump(exclude_unset=True, exclude={"questions"}).items():
            setattr(obj, field, value)
        db.commit()
        db.refresh(obj)
        return QuizResponse.model_validate(obj)

    @staticmethod
    def delete_quiz(db: Session, quiz_id: int) -> dict:
        obj = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Quiz not found")
        db.delete(obj)
        db.commit()
        return {"detail": "Quiz deleted successfully"}

    # ── Submission & results ──────────────────────────────────────────────────

    @staticmethod
    def submit_quiz(
        db: Session, quiz_id: int, student_id: int, payload: QuizSubmitPayload
    ) -> ResultResponse:
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")

        if db.query(Result).filter(Result.quiz_id == quiz_id, Result.student_id == student_id).first():
            raise HTTPException(status_code=400, detail="Quiz already submitted")

        total = len(quiz.questions)
        correct = 0
        for answer in payload.answers:
            question = (
                db.query(QuizQuestion)
                .filter(QuizQuestion.id == answer.question_id, QuizQuestion.quiz_id == quiz_id)
                .first()
            )
            if question and question.correct_option_id == answer.selected_option_id:
                correct += 1

        score = round((correct / total * 100) if total else 0, 2)
        result = Result(
            quiz_id=quiz_id,
            student_id=student_id,
            score=score,
            total_questions=total,
            correct_answers=correct,
        )
        db.add(result)
        db.commit()
        db.refresh(result)
        return ResultResponse.model_validate(result)

    @staticmethod
    def get_quiz_results(db: Session, quiz_id: int) -> list:
        if not db.query(Quiz).filter(Quiz.id == quiz_id).first():
            raise HTTPException(status_code=404, detail="Quiz not found")
        results = db.query(Result).filter(Result.quiz_id == quiz_id).all()
        return [ResultResponse.model_validate(r) for r in results]