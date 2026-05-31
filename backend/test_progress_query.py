import sys
from pathlib import Path

# Add backend to sys.path
backend_path = Path("/Users/mac/Documents/School ITC/Year3/wdim/lms-fastapi/backend")
sys.path.insert(0, str(backend_path))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import expression
from app.models.progress import StudentLessonProgress
from app.config.config import settings

SQLALCHEMY_DATABASE_URL = (
    f"postgresql+psycopg2://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}"
    f"@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
)

engine = create_engine(SQLALCHEMY_DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

student_id = "b96da4b9-16a8-4ba6-9604-75c86b580479"

try:
    print("Testing filter(False) in SQLAlchemy...")
    res = db.query(StudentLessonProgress).filter(
        StudentLessonProgress.student_id == student_id,
        False, # This is what was in progress.py
        StudentLessonProgress.completed == True
    ).all()
    print("SUCCESS: filter(False) worked!")
except Exception as e:
    print(f"FAILED: filter(False) threw an error! Details: {e}")

db.close()
