import sys
from pathlib import Path

# Add backend to sys.path
backend_path = Path("/Users/mac/Documents/School ITC/Year3/wdim/lms-fastapi/backend")
sys.path.insert(0, str(backend_path))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.course import Course, Module, Lesson
from app.models.user import User
from app.models.progress import StudentCourseProgress
from app.routes.progress import get_course_progress
from app.config.config import settings

SQLALCHEMY_DATABASE_URL = (
    f"postgresql+psycopg2://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}"
    f"@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
)

engine = create_engine(SQLALCHEMY_DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

# Load a student user (e.g. b96da4b9-16a8-4ba6-9604-75c86b580479)
student = db.query(User).filter(User.id == "b96da4b9-16a8-4ba6-9604-75c86b580479").first()
if not student:
    student = db.query(User).first()

print(f"Testing Learn Hub endpoints as user: '{student.username}' (ID: {student.id})")

try:
    print("\n1. Testing Course Service get_course_by_id...")
    from app.services.course_service import CourseService
    course = CourseService.get_course_by_id(db, 1)
    print(f"SUCCESS: Course title = '{course.title}'")
except Exception as e:
    print(f"FAILED: Course details check! {e}")

try:
    print("\n2. Testing Course Modules outline query...")
    modules = db.query(Module).filter(Module.course_id == 1).all()
    print(f"SUCCESS: Found {len(modules)} modules")
except Exception as e:
    print(f"FAILED: Modules query check! {e}")

try:
    print("\n3. Testing get_course_progress API logic...")
    agg = get_course_progress(1, db, student)
    print(f"SUCCESS: Progress aggregations calculated: Percentage={agg.progress_percentage}%")
except Exception as e:
    print(f"FAILED: get_course_progress logic check! {e}")

db.close()
