import sys
from pathlib import Path

# Add backend to sys.path
backend_path = Path("/Users/mac/Documents/School ITC/Year3/wdim/lms-fastapi/backend")
sys.path.insert(0, str(backend_path))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.quiz import Quiz, QuizQuestion, QuizOption
from app.config.config import settings

SQLALCHEMY_DATABASE_URL = (
    f"postgresql+psycopg2://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}"
    f"@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
)

engine = create_engine(SQLALCHEMY_DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

# Check if questions already exist
existing_q = db.query(QuizQuestion).first()
if existing_q:
    print("Questions already exist in database. Skipping generation.")
    db.close()
    sys.exit(0)

print("Populating Quiz Questions and Options...")

# Quiz 1: CSS Grid & Flexbox Properties (ID = 1)
q1 = QuizQuestion(quiz_id=1, question_text="Which CSS property is used to define a container as a flex container?")
db.add(q1)
db.flush()

db.add(QuizOption(question_id=q1.id, option_text="display: inline-flex", is_correct=0))
db.add(QuizOption(question_id=q1.id, option_text="display: flex", is_correct=1))
db.add(QuizOption(question_id=q1.id, option_text="display: grid", is_correct=0))
db.add(QuizOption(question_id=q1.id, option_text="float: left", is_correct=0))

q2 = QuizQuestion(quiz_id=1, question_text="Which property controls alignment along the main axis in a flex container?")
db.add(q2)
db.flush()

db.add(QuizOption(question_id=q2.id, option_text="align-items", is_correct=0))
db.add(QuizOption(question_id=q2.id, option_text="align-content", is_correct=0))
db.add(QuizOption(question_id=q2.id, option_text="justify-content", is_correct=1))
db.add(QuizOption(question_id=q2.id, option_text="flex-direction", is_correct=0))


# Quiz 2: JS Scope, Closures & Event Propagation (ID = 2)
q3 = QuizQuestion(quiz_id=2, question_text="What type of scope is created by a variable declared with 'let' or 'const'?")
db.add(q3)
db.flush()

db.add(QuizOption(question_id=q3.id, option_text="Block scope", is_correct=1))
db.add(QuizOption(question_id=q3.id, option_text="Function scope", is_correct=0))
db.add(QuizOption(question_id=q3.id, option_text="Global scope only", is_correct=0))

q4 = QuizQuestion(quiz_id=2, question_text="What is a closure in JavaScript?")
db.add(q4)
db.flush()

db.add(QuizOption(question_id=q4.id, option_text="A way to close browser windows", is_correct=0))
db.add(QuizOption(question_id=q4.id, option_text="The combination of a function bundled together with references to its surrounding state", is_correct=1))
db.add(QuizOption(question_id=q4.id, option_text="A method to exit recursive loops", is_correct=0))

db.commit()
print("Successfully populated Quiz Questions and Options!")
db.close()
