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
        db: Session, quiz_id: int, student_id: str, payload: QuizSubmitPayload
    ) -> ResultResponse:
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")

        # Check if already submitted
        existing = db.query(Result).filter(Result.quiz_id == quiz_id, Result.student_id == student_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Quiz already submitted")

        # Calculate questions and correct answers
        questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).all()
        total = len(questions)
        if total == 0:
            raise HTTPException(status_code=400, detail="Quiz has no questions")

        correct = 0
        for q_id, opt_id in payload.answers.items():
            try:
                q_id_int = int(q_id)
                opt_id_int = int(opt_id)
            except ValueError:
                continue

            # Verify the question belongs to this quiz
            question = db.query(QuizQuestion).filter(QuizQuestion.id == q_id_int, QuizQuestion.quiz_id == quiz_id).first()
            if not question:
                continue
            
            # Verify the option belongs to this question and is correct
            option = db.query(QuizOption).filter(QuizOption.id == opt_id_int, QuizOption.question_id == q_id_int).first()
            if option and option.is_correct == 1:
                correct += 1

        percentage = round((correct / total) * 100, 1)
        score_val = int(round(percentage))
        
        # Grade calculation
        if score_val >= 90:
            grade = "A"
        elif score_val >= 80:
            grade = "B"
        elif score_val >= 70:
            grade = "C"
        elif score_val >= 60:
            grade = "D"
        elif score_val >= 50:
            grade = "E"
        else:
            grade = "F"
            
        is_passed = score_val >= 50

        result = Result(
            quiz_id=quiz_id,
            student_id=student_id,
            graded_by=quiz.instructor_id,
            score=score_val,
            total_marks=100,
            percentage=percentage,
            grade=grade,
            is_passed=is_passed,
            feedback=f"Completed interactive quiz. Correct answers: {correct}/{total}.",
        )
        db.add(result)
        db.flush()

        # If the quiz is associated with a lesson, automatically mark that lesson completed!
        if quiz.lesson_id:
            try:
                from app.models.progress import StudentLessonProgress
                from app.routes.progress import recalculate_course_progress

                prog = db.query(StudentLessonProgress).filter(
                    StudentLessonProgress.student_id == student_id,
                    StudentLessonProgress.lesson_id == quiz.lesson_id
                ).first()
                if not prog:
                    prog = StudentLessonProgress(student_id=student_id, lesson_id=quiz.lesson_id)
                    db.add(prog)
                prog.completed = True
                prog.completed_at = func.now()
                db.flush()

                # Recalculate course progress percentage
                recalculate_course_progress(db, student_id, quiz.course_id)
            except Exception as e:
                # Gracefully log or ignore to avoid blocking submission
                print(f"Failed to auto-update student progress on quiz submit: {e}")

        db.commit()
        db.refresh(result)
        return ResultResponse.model_validate(result)

    @staticmethod
    def get_quiz_results(db: Session, quiz_id: int) -> list:
        if not db.query(Quiz).filter(Quiz.id == quiz_id).first():
            raise HTTPException(status_code=404, detail="Quiz not found")
        results = db.query(Result).filter(Result.quiz_id == quiz_id).all()
        return [ResultResponse.model_validate(r) for r in results]