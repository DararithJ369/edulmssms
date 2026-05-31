import sys
from pathlib import Path

# Add backend to sys.path
backend_path = Path("/Users/mac/Documents/School ITC/Year3/wdim/lms-fastapi/backend")
sys.path.insert(0, str(backend_path))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.quiz import Quiz, QuizQuestion, QuizOption
from app.models.result import Result
from app.services.quiz_service import QuizService
from app.schemas.quiz import QuizSubmitPayload
from app.config.config import settings

SQLALCHEMY_DATABASE_URL = (
    f"postgresql+psycopg2://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}"
    f"@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
)

engine = create_engine(SQLALCHEMY_DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

# Student details
student_id = "b96da4b9-16a8-4ba6-9604-75c86b580479"

# Remove any existing results for this quiz/student
db.query(Result).filter(Result.quiz_id == 1, Result.student_id == student_id).delete()
db.commit()

# Prepare payload: Question 1 -> Option 2 (Correct), Question 2 -> Option 7 (Correct)
# Options:
# Question 1: id=1(inline-flex), id=2(flex - correct), id=3(grid), id=4(left)
# Question 2: id=5(align-items), id=6(align-content), id=7(justify-content - correct), id=8(flex-direction)
payload = QuizSubmitPayload(answers={1: 2, 2: 7})

print("Attempting to submit Quiz ID: 1 as Student b96da4b9-16a8-4ba6-9604-75c86b580479...")
result = QuizService.submit_quiz(db, 1, student_id, payload)
print(f"SUCCESS! Submitted Quiz. Score: {result.score}%, Grade: '{result.grade}', Passed: {result.is_passed}, Feedback: '{result.feedback}'")

# Assert Result is created in database
db_result = db.query(Result).filter(Result.quiz_id == 1, Result.student_id == student_id).first()
assert db_result is not None, "Result was not successfully stored in database!"
assert db_result.score == 100, f"Expected 100% score but got {db_result.score}%!"

# Clean up
db.delete(db_result)
db.commit()
print("SUCCESS: Quiz submission integration tests pass completely!")

db.close()
