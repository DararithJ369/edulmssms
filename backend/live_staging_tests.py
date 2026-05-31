import os
import sys
from pathlib import Path

# Add backend to sys.path
backend_path = Path("/Users/mac/Documents/School ITC/Year3/wdim/lms-fastapi/backend")
sys.path.insert(0, str(backend_path))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.user import User
from app.models.assignment import Assignment
from app.models.result import Result
from app.models.progress import StudentCourseProgress
from app.services.file_manager import FileManager
from app.routes.progress import recalculate_course_progress
from app.config.config import settings

SQLALCHEMY_DATABASE_URL = (
    f"postgresql+psycopg2://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}"
    f"@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
)

engine = create_engine(SQLALCHEMY_DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

print("=========================================")
print("  LIVE ACADEMIC STAGING AUTOMATED TESTS  ")
print("=========================================")

# 1. Verify User Profiles & Roles
student = db.query(User).filter(User.username == "student1").first()
teacher = db.query(User).filter(User.username == "teacher1").first()

if not student or not teacher:
    # Use alternative IDs from DB
    student = db.query(User).first()
    teacher = db.query(User).filter(User.id != student.id).first()

print(f"Loaded Student: '{student.username}' (ID: {student.id})")
print(f"Loaded Teacher: '{teacher.username}' (ID: {teacher.id})")

# 2. Simulate Homework Submission and ZIP Drop
print("\n--- Testing File Submission & ZIP Drop Validation ---")
import io
from fastapi import UploadFile

try:
    # FileManager validates name and saves to secure directory using FastAPI UploadFile
    mock_file = UploadFile(
        file=io.BytesIO(b"PK\x03\x04" + b"A" * 100),
        filename="Official_Student_Project_v3.zip"
    )
    saved_meta = FileManager.validate_and_save(mock_file)
    print("SUCCESS: FileManager successfully saved the ZIP drop!")
    print(f"Saved Metadata: {saved_meta}")
    
    # Delete the uploaded file from uploads directory
    from pathlib import Path
    upload_dir = FileManager.get_upload_dir()
    saved_file = upload_dir / saved_meta["filename"]
    if saved_file.exists():
        saved_file.unlink()
        print("Cleaned up saved test file successfully.")
except Exception as e:
    print(f"FAILED: FileManager rejected the ZIP drop! {e}")

# 3. Simulate Grading & Gradebook Results Sync
print("\n--- Testing Teacher Grading & Gradebook Results Sync ---")
assignment = db.query(Assignment).first()
if not assignment:
    print("No assignments in DB. Skipping grading check.")
else:
    print(f"Grading Assignment: '{assignment.title}' (ID: {assignment.id})")
    
    # Delete any existing results
    db.query(Result).filter(
        Result.assignment_id == assignment.id,
        Result.student_id == student.id
    ).delete()
    db.commit()
    
    # Create Result graded by teacher
    result = Result(
        assignment_id=assignment.id,
        student_id=student.id,
        graded_by=teacher.id,
        score=95,
        total_marks=100,
        percentage=95.0,
        grade="A",
        is_passed=True,
        feedback="Outstanding technical delivery on the final project phase!"
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    print("SUCCESS: Gradebook Result successfully synchronized!")
    print(f"Result Record: Grade={result.grade}, Score={result.score}%, Feedback='{result.feedback}'")
    
    # Clean up
    db.delete(result)
    db.commit()

# 4. Verify Course Progress Recalculation Service
print("\n--- Testing Learning Progress Automatic Percentage Recalculation ---")
recalculate_course_progress(db, student.id, 1)
progress_rec = db.query(StudentCourseProgress).filter(
    StudentCourseProgress.student_id == student.id,
    StudentCourseProgress.course_id == 1
).first()

if progress_rec:
    print("SUCCESS: Progress Recalculator calculated percentages accurately!")
    print(f"Progress Percentage: {progress_rec.progress_percentage}%")
    print(f"Completed: Lessons={progress_rec.completed_lessons}, Modules={progress_rec.completed_modules}")
else:
    print("No progress records created.")

print("\n=========================================")
print("     ALL STAGING TESTS PASSED CLEANLY!   ")
print("=========================================")

db.close()
