from datetime import datetime, timedelta

from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.quiz import Quiz, QuizQuestion, QuizOption
from app.utils.colors import Colors


class QuizSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, Quiz)

    def seed_quizzes(self, courses: list, instructor_ids: list[str]):
        bind = self.db.bind
        if not isinstance(bind, Engine):
            Colors.warning("Database bind is not an Engine, skipping quiz seeding")
            return []
        inspector = inspect(bind)
        if "quizzes" not in set(inspector.get_table_names()):
            Colors.warning("Table 'quizzes' does not exist, skipping quiz seeding")
            return []

        def get_instructor_id(course_idx: int) -> str:
            if not instructor_ids:
                return None
            return instructor_ids[course_idx % len(instructor_ids)]

        created = []
        from app.models.course import Lesson, Module
        
        # Details defining 4 quizzes per course
        quizzes_map = {
            "DS-210": [
                ("Quiz 1 — Database Architecture Keys", "Short evaluation covering primary, foreign, candidate, and super keys in relational systems.", 4),
                ("Quiz 2 — Schema Normalization Rules", "Tests your knowledge on functional dependencies and decomposing relations to 3NF/BCNF.", 11),
                ("Quiz 3 — SQL Basics & Aggregate Functions", "Covers SELECT statements, filtering with WHERE, and aggregating with GROUP BY.", 18),
                ("Quiz 4 — Relational Joins & Subqueries", "Assessments on INNER, OUTER, LEFT, RIGHT joins, and nested subquery statements.", 25)
            ],
            "IT-201": [
                ("Quiz 1 — HTML5 Elements & CSS layouts", "Covers document structural tags, flexbox item alignments, and CSS Grid templates.", 4),
                ("Quiz 2 — JavaScript ES6 Syntax & Functions", "Evaluates arrow functions, destructuring methods, closures, and async-await fetch.", 11),
                ("Quiz 3 — React Component Hooks State", "Tests local state hooks (useState), lifecycle hooks (useEffect), and props communication.", 18),
                ("Quiz 4 — Next.js Dashboard App Router", "Evaluates server components, routing boundaries, and SSR data fetching.", 25)
            ],
            "DS-301": [
                ("Quiz 1 — Math Essentials & Vectors", "Covers matrix multiplication, linear dependencies, and calculus gradient calculations.", 4),
                ("Quiz 2 — Supervised Linear Regression", "Tests cost functions, learning rate setups, and gradient descent optimization.", 11),
                ("Quiz 3 — Clustering & Dimension Reduction", "Evaluates K-Means partitioning, elbow charts, and PCA dimensional reductions.", 18),
                ("Quiz 4 — Decision Trees & Random Forests", "Tests information gain, entropy metrics, bagging, and random forest models.", 25)
            ],
            "CS-101": [
                ("Quiz 1 — Python Operators & Control Flow", "Evaluates BASH CLI executions, variable types, logical AND/OR, and basic if statements.", 4),
                ("Quiz 2 — Python Loops & Collections", "Covers for loops, while loops, list slicing, and tuple immutability.", 11),
                ("Quiz 3 — Dictionaries & Functions Scope", "Tests hashing lookups, nested dictionary items, and function scopes.", 18),
                ("Quiz 4 — Class Objects & Exceptions", "Evaluates class initializers, try-except containment, and unit testing.", 25)
            ]
        }

        # Structured MCQ question bank for core courses
        mcq_bank = {
            "DS-210": [
                {
                    "question": "Which of the following uniquely identifies a row in a relational database table?",
                    "options": [("Foreign Key", 0), ("Candidate Key", 0), ("Primary Key", 1), ("Composite Key", 0)]
                },
                {
                    "question": "Which SQL statement is used to remove duplicate rows from a query result set?",
                    "options": [("SELECT UNIQUE", 0), ("SELECT DISTINCT", 1), ("SELECT GROUP", 0), ("SELECT ORDER", 0)]
                },
                {
                    "question": "What constraint ensures database record consistency by rejecting unmatched foreign keys?",
                    "options": [("Domain Integrity", 0), ("Referential Integrity", 1), ("Entity Integrity", 0), ("Unique Constraint", 0)]
                },
                {
                    "question": "Which join type returns all records from the left table and matching records from the right table?",
                    "options": [("INNER JOIN", 0), ("LEFT JOIN", 1), ("RIGHT JOIN", 0), ("FULL OUTER JOIN", 0)]
                },
                {
                    "question": "Which database normal form requires removing transitive dependencies?",
                    "options": [("1NF", 0), ("2NF", 0), ("3NF", 1), ("BCNF", 0)]
                }
            ],
            "IT-201": [
                {
                    "question": "Which CSS layout property is best suited for 1-dimensional horizontal/vertical element alignment?",
                    "options": [("display: grid", 0), ("display: block", 0), ("display: flex", 1), ("float: left", 0)]
                },
                {
                    "question": "What is the correct syntax to listen to click events on a DOM node in JavaScript?",
                    "options": [("node.onclick(fn)", 0), ("node.addEventListener('click', fn)", 1), ("node.listen('click', fn)", 0), ("node.attachEvent('click', fn)", 0)]
                },
                {
                    "question": "Which React hook is used to handle side-effects like fetching data from a remote server?",
                    "options": [("useState", 0), ("useContext", 0), ("useEffect", 1), ("useReducer", 0)]
                },
                {
                    "question": "By default in the Next.js App Router, all components inside the app folder are:",
                    "options": [("Client Components", 0), ("Server Components", 1), ("Static Pages", 0), ("Redux wrappers", 0)]
                },
                {
                    "question": "Which asynchronous Javascript keyword returns a Promise?",
                    "options": [("await", 0), ("async", 1), ("then", 0), ("fetch", 0)]
                }
            ]
        }

        for course_idx, course in enumerate(courses):
            course_id = course.id
            course_code = course.course_code
            instructor_id = course.instructor_id or get_instructor_id(course_idx)
            
            # Retrieve lessons to link
            lessons = self.db.query(Lesson).join(Module).filter(Module.course_id == course_id).order_by(Lesson.order.asc()).all()

            data_list = quizzes_map.get(course_code, [
                ("Quiz 1 — Foundational Review", "Short quiz covering basic concepts of the course.", 4),
                ("Quiz 2 — Core Concepts Quiz", "Assessments checking key theories and practices.", 11),
                ("Quiz 3 — Intermediate Assessment", "Evaluation on intermediate methodologies.", 18),
                ("Quiz 4 — Final Blueprint Review", "Final preparatory evaluation prior to exams.", 25)
            ])

            for idx, (title, desc, day_offset) in enumerate(data_list):
                lesson_id = lessons[idx % len(lessons)].id if lessons else None
                module_name = lessons[idx % len(lessons)].module.title if (lessons and lessons[idx % len(lessons)].module) else f"Module {idx+1}"

                existing = self.db.query(Quiz).filter_by(title=title, course_id=course_id).first()
                
                q_data = {
                    "title": title,
                    "description": desc,
                    "module_name": module_name,
                    "due_date": datetime.utcnow() + timedelta(days=day_offset),
                    "course_id": course_id,
                    "lesson_id": lesson_id,
                    "instructor_id": instructor_id
                }

                if existing:
                    # Update
                    for k, v in q_data.items():
                        setattr(existing, k, v)
                    quiz = existing
                else:
                    quiz = self.create_one(lambda d=q_data: d, skip_if_exists=False)
                    self.db.flush()

                if quiz:
                    created.append(quiz)
                    self._seed_questions_for_quiz(quiz, course_code, mcq_bank, idx)

        self.db.commit()
        Colors.success(f"{len(created)} quiz(zes) and associated MCQ questions seeded")
        return created

    def _seed_questions_for_quiz(self, quiz: Quiz, course_code: str, mcq_bank: dict, quiz_idx: int):
        """Seed exactly 5 MCQ questions with 4 options each under the quiz"""
        
        # Check if questions already exist for this quiz
        existing_qs = self.db.query(QuizQuestion).filter_by(quiz_id=quiz.id).all()
        if existing_qs:
            return

        # Retrieve custom questions list or generate generic ones
        questions_list = mcq_bank.get(course_code)
        
        for q_num in range(1, 6):
            if questions_list and (q_num - 1) < len(questions_list):
                q_data = questions_list[q_num - 1]
                question_text = q_data["question"]
                options = q_data["options"]
            else:
                question_text = f"Review Question {q_num} for {quiz.title}: Which of the following statements represents a core guideline?"
                options = [
                    (f"Standard parameter declaration A for {quiz.title}", 1 if q_num % 4 == 0 else 0),
                    (f"Standard parameter declaration B for {quiz.title}", 1 if q_num % 4 == 1 else 0),
                    (f"Standard parameter declaration C for {quiz.title}", 1 if q_num % 4 == 2 else 0),
                    (f"Standard parameter declaration D for {quiz.title}", 1 if q_num % 4 == 3 else 0)
                ]

            qq = QuizQuestion(
                quiz_id=quiz.id,
                question_text=question_text,
                question_type="multiple_choice"
            )
            self.db.add(qq)
            self.db.flush()

            for opt_text, is_corr in options:
                qo = QuizOption(
                    question_id=qq.id,
                    option_text=opt_text,
                    is_correct=is_corr
                )
                self.db.add(qo)
        
        self.db.flush()
