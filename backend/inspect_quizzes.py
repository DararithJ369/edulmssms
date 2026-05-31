import sys
from pathlib import Path

# Add backend to sys.path
backend_path = Path("/Users/mac/Documents/School ITC/Year3/wdim/lms-fastapi/backend")
sys.path.insert(0, str(backend_path))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.quiz import Quiz, QuizQuestion, QuizOption
from app.models.result import Result
from app.config.config import settings

SQLALCHEMY_DATABASE_URL = (
    f"postgresql+psycopg2://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}"
    f"@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
)

engine = create_engine(SQLALCHEMY_DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

print("--- QUIZZES ---")
quizzes = db.query(Quiz).all()
for q in quizzes:
    print(f"Quiz ID: {q.id}, Title: {q.title}, Course ID: {q.course_id}, Lesson ID: {q.lesson_id}")
    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == q.id).all()
    for question in questions:
        print(f"  Question ID: {question.id}, Text: {question.question_text}")
        options = db.query(QuizOption).filter(QuizOption.question_id == question.id).all()
        for opt in options:
            print(f"    Option ID: {opt.id}, Text: {opt.option_text}, Is Correct: {opt.is_correct}")

db.close()
