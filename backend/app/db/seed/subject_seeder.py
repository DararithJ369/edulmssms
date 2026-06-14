from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.subject import Subject
from app.utils.colors import Colors


class SubjectSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, Subject)

    def seed_subjects(self, instructor_ids: list[str]):
        bind = self.db.bind
        if not isinstance(bind, Engine):
            Colors.warning("Database bind is not an Engine, skipping subject seeding")
            return []
        inspector = inspect(bind)
        if "subjects" not in set(inspector.get_table_names()):
            Colors.warning("Table 'subjects' does not exist, skipping subject seeding")
            return []

        def get_instructor(index: int) -> str:
            if not instructor_ids:
                return None
            return instructor_ids[index % len(instructor_ids)]

        subjects_data = [
            # Applied Mathematics & Statistics (5 subjects)
            {"name": "Linear Algebra", "code": "MATH101", "description": "Vector spaces, matrices, linear transformations, eigenvalues, and applications.", "credits": 3, "hours_per_week": 3, "is_active": True, "instructor_idx": 0},
            {"name": "Probability & Applied Statistics", "code": "MATH102", "description": "Probability theory, random variables, hypothesis testing, and regression analysis.", "credits": 3, "hours_per_week": 3, "is_active": True, "instructor_idx": 1},
            {"name": "Numerical Analysis", "code": "MATH201", "description": "Numerical methods for solving equations, integration, differentiation, and differential equations.", "credits": 3, "hours_per_week": 3, "is_active": True, "instructor_idx": 2},
            {"name": "Discrete Mathematics", "code": "MATH202", "description": "Set theory, logic, graph theory, combinatorics, and algebraic structures.", "credits": 3, "hours_per_week": 3, "is_active": True, "instructor_idx": 3},
            {"name": "Calculus & Analytical Geometry", "code": "MATH301", "description": "Limits, derivatives, integrals, infinite series, and coordinate geometries.", "credits": 4, "hours_per_week": 4, "is_active": True, "instructor_idx": 4},
            
            # Computer Science (5 subjects)
            {"name": "Introduction to Programming in Python", "code": "CS101", "description": "Basic programming syntax, structures, functions, and modules in Python.", "credits": 3, "hours_per_week": 3, "is_active": True, "instructor_idx": 5},
            {"name": "Data Structures", "code": "CS201", "description": "Arrays, linked lists, stacks, queues, trees, hash tables, and computational complexity.", "credits": 4, "hours_per_week": 4, "is_active": True, "instructor_idx": 6},
            {"name": "Design and Analysis of Algorithms", "code": "CS202", "description": "Divide-and-conquer, greedy, dynamic programming, and complexity classes NP.", "credits": 3, "hours_per_week": 3, "is_active": True, "instructor_idx": 7},
            {"name": "Operating Systems", "code": "CS301", "description": "Processes, threads, CPU scheduling, memory management, file systems, and virtualization.", "credits": 3, "hours_per_week": 3, "is_active": True, "instructor_idx": 8},
            {"name": "Computer Architecture & Assembly", "code": "CS302", "description": "Digital logic, processor design, assembly language, pipelining, and memory hierarchy.", "credits": 3, "hours_per_week": 3, "is_active": True, "instructor_idx": 9},

            # Information Technology (5 subjects)
            {"name": "Web Application Architecture", "code": "IT201", "description": "Design and implementation of distributed, secure web application systems.", "credits": 3, "hours_per_week": 3, "is_active": True, "instructor_idx": 10},
            {"name": "Systems Administration & Linux", "code": "IT202", "description": "Linux CLI navigation, system services, permissions, scripting, and server setup.", "credits": 3, "hours_per_week": 3, "is_active": True, "instructor_idx": 11},
            {"name": "Computer Networks & Protocols", "code": "IT301", "description": "OSI and TCP/IP layers, routing, switching, IP addressing, and socket programming.", "credits": 3, "hours_per_week": 3, "is_active": True, "instructor_idx": 12},
            {"name": "Cyber Security Foundations", "code": "IT302", "description": "Symmetric and asymmetric cryptography, firewalls, network security threats, and defensive policies.", "credits": 3, "hours_per_week": 3, "is_active": True, "instructor_idx": 13},
            {"name": "Cloud Computing & Virtualization", "code": "IT401", "description": "Hypervisors, VM provisioning, AWS/GCP architecture, and serverless compute frameworks.", "credits": 3, "hours_per_week": 3, "is_active": True, "instructor_idx": 14},

            # Software Engineering (5 subjects)
            {"name": "Software Design Patterns", "code": "SE201", "description": "Creational, structural, and behavioral object-oriented software design patterns.", "credits": 3, "hours_per_week": 3, "is_active": True, "instructor_idx": 15},
            {"name": "Software Architecture & Design", "code": "SE202", "description": "Monolithic, microservices, and event-driven architectures, UML modeling, and systems design.", "credits": 3, "hours_per_week": 3, "is_active": True, "instructor_idx": 16},
            {"name": "Agile Methodologies & DevOps", "code": "SE301", "description": "Scrum roles, backlog management, continuous integration (CI), and automated deployment.", "credits": 3, "hours_per_week": 3, "is_active": True, "instructor_idx": 17},
            {"name": "Software Quality Assurance & Testing", "code": "SE302", "description": "Unit testing, integration testing, boundary checks, and automated validation scripts.", "credits": 3, "hours_per_week": 3, "is_active": True, "instructor_idx": 18},
            {"name": "Human-Computer Interaction", "code": "SE401", "description": "UX principles, wireframing, usability testing, and interactive widget design guidelines.", "credits": 3, "hours_per_week": 3, "is_active": True, "instructor_idx": 19},

            # Data Science (5 subjects)
            {"name": "Introduction to Data Science", "code": "DS201", "description": "Data pipelines, wrangling, exploratory data analysis (EDA), and basic statistics.", "credits": 3, "hours_per_week": 3, "is_active": True, "instructor_idx": 0},
            {"name": "Database Systems & SQL", "code": "DS210", "description": "Relational schema design, normalization, join queries, indexing, and transactional DDL.", "credits": 3, "hours_per_week": 3, "is_active": True, "instructor_idx": 1},
            {"name": "Machine Learning Algorithms", "code": "DS301", "description": "Regression models, decision trees, random forests, clustering, and ensemble architectures.", "credits": 4, "hours_per_week": 4, "is_active": True, "instructor_idx": 2},
            {"name": "Deep Learning & Neural Networks", "code": "DS302", "description": "Artificial neural networks, backpropagation, CNNs for image classification, and RNNs.", "credits": 4, "hours_per_week": 4, "is_active": True, "instructor_idx": 3},
            {"name": "Big Data Analytics", "code": "DS401", "description": "Hadoop ecosystem, MapReduce framework, Apache Spark cluster compute, and distributed querying.", "credits": 3, "hours_per_week": 3, "is_active": True, "instructor_idx": 4}
        ]

        created = []
        for data in subjects_data:
            existing = self.db.query(Subject).filter_by(name=data["name"]).first()
            if existing:
                created.append(existing)
                continue
            
            # Map instructor ID based on defined index mapping
            instructor_id = get_instructor(data["instructor_idx"])
            
            subject_data = {
                "name": data["name"],
                "code": data["code"],
                "description": data["description"],
                "credits": data["credits"],
                "hours_per_week": data["hours_per_week"],
                "instructor_id": instructor_id,
                "is_active": True
            }
            
            instance = self.create_one(lambda d=subject_data: d, skip_if_exists=False)
            if instance:
                created.append(instance)

        self.db.commit()
        Colors.success(f"{len(created)} subject(s) seeded")
        return created
