from datetime import datetime, timedelta

from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.assignment import Assignment
from app.utils.colors import Colors


class AssignmentSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, Assignment)

    def seed_assignments(self, courses: list, instructor_ids: list[str]):
        bind = self.db.bind
        if not isinstance(bind, Engine):
            Colors.warning("Database bind is not an Engine, skipping assignment seeding")
            return []
        inspector = inspect(bind)
        if "assignments" not in set(inspector.get_table_names()):
            Colors.warning("Table 'assignments' does not exist, skipping assignment seeding")
            return []

        def get_instructor_id(course_idx: int) -> str:
            if not instructor_ids:
                return None
            return instructor_ids[course_idx % len(instructor_ids)]

        created = []
        from app.models.course import Lesson, Module
        
        # Details defining 3 assignments for each of the 10 courses
        assignments_map = {
            "DS-210": [
                ("Assignment 1 — Draw Entity Relationship Diagram", "Draw a complete crow's foot ERD detailing a university registration system with entities: Student, Class, Course, Enrollment, and Teacher. Identify primary and foreign keys.", 5),
                ("Assignment 2 — Relational Schema Normalization", "Given a flat unnormalized table, normalize the schema step-by-step through 1NF, 2NF, and 3NF. Document functional dependencies and functional closures.", 12),
                ("Assignment 3 — SQL Aggregate Queries & Window Functions", "Write SQL scripts executing complex aggregate groupings and window functions over historical student transaction datasets.", 19)
            ],
            "IT-201": [
                ("Assignment 1 — Personal Portfolio Website Layout", "Design and build a responsive personal portfolio page showing off projects using CSS Grid and Flexbox layouts. Must be semantically correct.", 6),
                ("Assignment 2 — Client-Side Memory Match Game", "Create a browser memory card matching game in JavaScript showcasing event listeners, DOM elements manipulation, and timer arrays.", 13),
                ("Assignment 3 — Task API Service with FastAPI", "Develop a FastAPI REST API server exposing CRUD endpoints for a secure Task manager. Validate JSON request bodies using Pydantic models.", 20)
            ],
            "DS-301": [
                ("Assignment 1 — Linear Regression Scratch Build", "Implement a simple linear regression algorithm in Python from scratch using gradient descent optimization without Scikit-learn.", 7),
                ("Assignment 2 — Unsupervised K-Means Cluster Model", "Build a customer segmentation model using K-Means clustering. Apply the elbow method to choose cluster size.", 14),
                ("Assignment 3 — Decision Tree Classifier", "Write a python script that trains a decision tree classifier over a classification dataset and measures accuracy and recall scores.", 21)
            ],
            "SE-202": [
                ("Assignment 1 — SOLID Principles Refactoring", "Refactor a bloated, tightly-coupled codebase to conform strictly to SOLID design principles. Write a UML class diagram detailing the changes.", 6),
                ("Assignment 2 — Design Pattern Catalog Implementation", "Implement creational (Singleton, Factory) and structural (Adapter, Decorator) design patterns in a unified console system.", 13),
                ("Assignment 3 — Microservice Architecture Design Project", "Draft a complete system architecture layout diagram detailing api gateways, data sync policies, and microservice structures.", 20)
            ],
            "MATH-102": [
                ("Assignment 1 — Descriptive Analysis & Data Plots", "Compute statistical aggregates (mean, variance, standard deviation) for a dataset and draw matching box plots.", 5),
                ("Assignment 2 — Probability Distribution Exercises", "Solve probability modeling questions applying binomial, Poisson, and normal distributions.", 12),
                ("Assignment 3 — Hypothesis Testing & Linear Regression", "Execute z-tests and t-tests on sample populations to calculate p-values. Fit simple linear regression equations.", 19)
            ],
            "CS-301": [
                ("Assignment 1 — Process Scheduling Mock", "Write a Python script simulating First-Come First-Served (FCFS) and Round Robin CPU process scheduling behaviors.", 6),
                ("Assignment 2 — Linux Shell Task Automation Script", "Create a BASH shell script that parses log files, extracts IP traffic summaries, and schedules execution using crontab.", 13),
                ("Assignment 3 — Semaphore Mutex Synchronization", "Implement shared memory synchronization blocks using mutext semaphores to resolve a classic dining philosophers problem.", 20)
            ],
            "IT-301": [
                ("Assignment 1 — IP Subnet Address Calculations", "Calculate subnet ranges, broadcast IDs, and host capacities given IP prefixes and network dimensions.", 5),
                ("Assignment 2 — LAN Routing Protocol Setup", "Build static routing maps and configure OSPF path configurations for a simulated 3-node network topology.", 12),
                ("Assignment 3 — SSL Handshake Packet Sniffing", "Capture SSL handshake packets using Wireshark, analyze certificate signatures, and document cryptographic suites.", 19)
            ],
            "CS-201": [
                ("Assignment 1 — Singly & Doubly Linked Lists", "Implement custom singly and doubly linked list data structures with node insertions, deletions, and reversals.", 6),
                ("Assignment 2 — BST Traversals & Balances", "Build a Binary Search Tree (BST) supporting in-order, pre-order, and post-order traversals and self-balancing rotations.", 13),
                ("Assignment 3 — Dijkstra Shortest Path Search", "Represent a network grid using adjacency matrices and execute Dijkstra's algorithm to search for the shortest path.", 20)
            ],
            "SE-301": [
                ("Assignment 1 — Backlog User Story Drafting", "Draft user stories with precise acceptance criteria (Given/When/Then format) for a client dashboard project.", 5),
                ("Assignment 2 — Git Merge Conflict Resolution", "Simulate parallel git branching merges, resolve conflict blocks programmatically, and perform a clean rebase.", 12),
                ("Assignment 3 — CI/CD Pipeline Automation", "Create an automated GitHub Actions YAML script executing build, unit-testing, and linting checks on commit pushes.", 19)
            ],
            "CS-101": [
                ("Assignment 1 — Command Line Expressions Solver", "Build a command line Python calculator parsing mathematical expressions and handling exceptions (e.g. division-by-zero).", 6),
                ("Assignment 2 — Grade Average Ledger Builder", "Implement a script using dictionaries and lists to calculate grade averages and output sorted rankings.", 13),
                ("Assignment 3 — News Headline Web Scraper", "Develop a BeautifulSoup scraper that requests news listings, parses headings/anchors, and writes outcomes to a CSV file.", 20)
            ]
        }

        for course_idx, course in enumerate(courses):
            course_id = course.id
            course_code = course.course_code
            instructor_id = course.instructor_id or get_instructor_id(course_idx)
            
            # Retrieve lessons to associate with assignments
            lessons = self.db.query(Lesson).join(Module).filter(Module.course_id == course_id).order_by(Lesson.order.asc()).all()

            data_list = assignments_map.get(course_code, [
                ("Assignment 1 — Practice Exercise", "Complete introductory exercises and submit solutions.", 5),
                ("Assignment 2 — Case Study Study", "Analyze technical case study details and submit analysis summary.", 12),
                ("Assignment 3 — Capstone Project", "Deliver final repository deliverables for course validation.", 19)
            ])

            for idx, (title, desc, day_offset) in enumerate(data_list):
                lesson_id = lessons[idx % len(lessons)].id if lessons else None
                module_name = lessons[idx % len(lessons)].module.title if (lessons and lessons[idx % len(lessons)].module) else f"Module {idx+1}"

                existing = self.db.query(Assignment).filter_by(title=title, course_id=course_id).first()
                
                a_data = {
                    "title": title,
                    "description": desc,
                    "module_name": module_name,
                    "due_date": datetime.utcnow() + timedelta(days=day_offset),
                    "attachment_file": "https://res.cloudinary.com/demo/image/upload/sample.jpg" if idx == 0 else None,
                    "course_id": course_id,
                    "lesson_id": lesson_id,
                    "teacher_id": instructor_id
                }

                if existing:
                    # Update parameters
                    for k, v in a_data.items():
                        setattr(existing, k, v)
                    created.append(existing)
                    continue

                assignment = self.create_one(lambda d=a_data: d, skip_if_exists=False)
                if assignment:
                    created.append(assignment)

        self.db.commit()
        Colors.success(f"{len(created)} assignment(s) seeded")
        return created
