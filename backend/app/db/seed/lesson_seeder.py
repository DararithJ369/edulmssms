from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.course import Lesson
from app.utils.colors import Colors


class LessonSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, Lesson)

    def seed_lessons(self, modules: list) -> list[Lesson]:
        """Seed lessons for all modules"""
        if not modules:
            return []

        bind = self.db.bind
        if not isinstance(bind, Engine):
            Colors.warning("Database bind is not an Engine, skipping lesson seeding")
            return []
        inspector = inspect(bind)
        if "lessons" not in set(inspector.get_table_names()):
            Colors.warning("Lessons table does not exist, skipping")
            return []

        lessons = []
        for module in modules:
            module_id = module.id
            title = module.title

            if title == "HTML5 & CSS3 Essentials":
                data_list = [
                    {
                        "title": "Introduction to HTML5 Semantic Tags",
                        "description": "Learn to structure your pages for high SEO rankings and readability with header, main, section, article, and footer tags.",
                        "content": "HTML5 semantic elements provide clear meaning to the browser and developer about what kind of content resides in each block...",
                        "duration": "45min",
                        "material_type": "video",
                        "material_url": "https://res.cloudinary.com/demo/video/upload/dog.mp4",
                        "order": 1,
                        "module_id": module_id,
                    },
                    {
                        "title": "CSS3 Flexbox Layout Guide",
                        "description": "Master horizontal and vertical element alignment with flex container and item properties.",
                        "content": "Flexbox layout provides a highly efficient way to lay out, align and distribute space among items in a container...",
                        "duration": "60min",
                        "material_type": "video",
                        "material_url": "https://res.cloudinary.com/demo/video/upload/dog.mp4",
                        "order": 2,
                        "module_id": module_id,
                    },
                    {
                        "title": "Responsive Designs & CSS Grid",
                        "description": "Build two-dimensional grid layouts that dynamically rearrange depending on screen viewports.",
                        "content": "CSS Grid Layout is the most powerful layout system available in CSS. It is a 2-dimensional system, meaning it handles both columns and rows...",
                        "duration": "50min",
                        "material_type": "document",
                        "material_url": "https://www.w3.org/TR/css-grid-1/CSS-Grid-Layout.pdf",
                        "order": 3,
                        "module_id": module_id,
                    },
                ]
            elif title == "Client-Side Javascript & DOM Manipulation":
                data_list = [
                    {
                        "title": "DOM Selection and Event Listeners",
                        "description": "Learn how to query DOM nodes dynamically and handle user click, input, and keyboard events.",
                        "content": "The Document Object Model (DOM) is a programming interface for HTML and XML documents. Event listeners wait for user interactions...",
                        "duration": "50min",
                        "material_type": "video",
                        "material_url": "https://res.cloudinary.com/demo/video/upload/dog.mp4",
                        "order": 1,
                        "module_id": module_id,
                    },
                    {
                        "title": "Asynchronous Operations & Web Fetch API",
                        "description": "Leverage promises, async/await, and query remote REST APIs for external data fetching.",
                        "content": "Asynchronous JavaScript allows you to perform resource-intensive operations without locking up the user interface...",
                        "duration": "55min",
                        "material_type": "video",
                        "material_url": "https://res.cloudinary.com/demo/video/upload/dog.mp4",
                        "order": 2,
                        "module_id": module_id,
                    },
                    {
                        "title": "Interactive Client-Side State Management",
                        "description": "Maintain variables, filter arrays, and map lists dynamically to render UI states without page reloads.",
                        "content": "State management refers to managing the data that flows through an interactive application to trigger corresponding UI re-renders...",
                        "duration": "45min",
                        "material_type": "document",
                        "material_url": "https://example.com/js_state_management.pdf",
                        "order": 3,
                        "module_id": module_id,
                    },
                ]
            elif title == "Backend Development with FastAPI & SQLite":
                data_list = [
                    {
                        "title": "FastAPI Path Handlers and Query Parameters",
                        "description": "Create route paths with decorator declarations, fetch URL params, and return JSON values.",
                        "content": "FastAPI is a modern, fast, web framework for building APIs with Python 3.8+ based on standard Python type hints...",
                        "duration": "40min",
                        "material_type": "video",
                        "material_url": "https://res.cloudinary.com/demo/video/upload/dog.mp4",
                        "order": 1,
                        "module_id": module_id,
                    },
                    {
                        "title": "Pydantic Schemas & Request Validation",
                        "description": "Enforce request body structures and data verification policies with BaseModel configurations.",
                        "content": "Pydantic is the most widely used data validation library for Python. It guarantees that incoming request data conforms to the schema...",
                        "duration": "45min",
                        "material_type": "video",
                        "material_url": "https://res.cloudinary.com/demo/video/upload/dog.mp4",
                        "order": 2,
                        "module_id": module_id,
                    },
                    {
                        "title": "SQLAlchemy ORM & Database Sessions",
                        "description": "Integrate database operations using declarative models, sessions, and execute raw/scoped queries.",
                        "content": "An ORM maps relational database tables directly to Python classes. SQLAlchemy sessions handle connections and transactions...",
                        "duration": "60min",
                        "material_type": "document",
                        "material_url": "https://example.com/sqlalchemy_orm_cheatsheet.pdf",
                        "order": 3,
                        "module_id": module_id,
                    },
                ]
            elif title == "Python Basics & Control Flow":
                data_list = [
                    {
                        "title": "Python Syntax, Variables & Operators",
                        "description": "Master dynamic types, variables, arithmetic operations, and console standard IO.",
                        "content": "Python is an interpreted, high-level, general-purpose programming language. Python design philosophy emphasizes readability...",
                        "duration": "35min",
                        "material_type": "video",
                        "material_url": "https://res.cloudinary.com/demo/video/upload/dog.mp4",
                        "order": 1,
                        "module_id": module_id,
                    },
                    {
                        "title": "Conditional Statements (if/elif/else)",
                        "description": "Design decision trees and path logic using boolean logical statements and indentation rules.",
                        "content": "Conditionals test boolean expressions to run distinct blocks of code depending on whether they evaluate to True or False...",
                        "duration": "40min",
                        "material_type": "video",
                        "material_url": "https://res.cloudinary.com/demo/video/upload/dog.mp4",
                        "order": 2,
                        "module_id": module_id,
                    },
                    {
                        "title": "For/While Loops and Control Statements",
                        "description": "Traverse collections and automate iterations safely using break, continue, and pass clauses.",
                        "content": "Loops allow repeating blocks of code. For loops iterate over sequences, while loops repeat as long as a condition holds...",
                        "duration": "45min",
                        "material_type": "document",
                        "material_url": "https://example.com/python_loops.pdf",
                        "order": 3,
                        "module_id": module_id,
                    },
                ]
            elif title == "Data Structures & Functions":
                data_list = [
                    {
                        "title": "Python Lists, Tuples, & Sets",
                        "description": "Manipulate lists (slice, append, list comprehensions) and structural elements with tuples and unique sets.",
                        "content": "Lists are mutable ordered sequences. Tuples are immutable ordered sequences. Sets are unordered collections of unique elements...",
                        "duration": "50min",
                        "material_type": "video",
                        "material_url": "https://res.cloudinary.com/demo/video/upload/dog.mp4",
                        "order": 1,
                        "module_id": module_id,
                    },
                    {
                        "title": "Python Dictionaries & Key Value Operations",
                        "description": "Build high-speed lookup tables and nested data objects with dictionaries and safety getter functions.",
                        "content": "Dictionaries map unique keys to values. They are highly optimized for fast hash-map data retrieval...",
                        "duration": "45min",
                        "material_type": "video",
                        "material_url": "https://res.cloudinary.com/demo/video/upload/dog.mp4",
                        "order": 2,
                        "module_id": module_id,
                    },
                    {
                        "title": "Designing Functions & Variable Scope",
                        "description": "Create reusable components with positional arguments, keyword arguments, and namespaces.",
                        "content": "Functions group reusable logic. Scope determines where variables are accessible: local, enclosing, global, or built-in...",
                        "duration": "55min",
                        "material_type": "document",
                        "material_url": "https://example.com/python_functions.pdf",
                        "order": 3,
                        "module_id": module_id,
                    },
                ]
            elif title == "Practical Web Scraping & APIs":
                data_list = [
                    {
                        "title": "Introduction to HTTP Protocol & Requests",
                        "description": "Learn the basics of GET, POST, headers, and status codes using the python-requests library.",
                        "content": "HTTP is the foundation of data communication on the World Wide Web. Request methods declare the desired action...",
                        "duration": "45min",
                        "material_type": "video",
                        "material_url": "https://res.cloudinary.com/demo/video/upload/dog.mp4",
                        "order": 1,
                        "module_id": module_id,
                    },
                    {
                        "title": "Parsing HTML Pages with BeautifulSoup",
                        "description": "Locate elements, extract target class names, query tags, and scrap text cleanly from remote pages.",
                        "content": "BeautifulSoup is a Python library for pulling data out of HTML and XML files. It creates parse trees for easy tag searching...",
                        "duration": "50min",
                        "material_type": "video",
                        "material_url": "https://res.cloudinary.com/demo/video/upload/dog.mp4",
                        "order": 2,
                        "module_id": module_id,
                    },
                    {
                        "title": "REST API Queries and JSON Serialization",
                        "description": "Query public web APIs, pass authentication headers, and serialize returned records.",
                        "content": "REST APIs represent state transfers over JSON. You can fetch and parse JSON responses directly in Python using `.json()`...",
                        "duration": "50min",
                        "material_type": "document",
                        "material_url": "https://example.com/rest_apis_guide.pdf",
                        "order": 3,
                        "module_id": module_id,
                    },
                ]
            else:
                data_list = [
                    {
                        "title": f"Lesson 1 for {title}",
                        "description": "Introduction and basic concepts.",
                        "content": "Standard lesson material...",
                        "duration": "30min",
                        "material_type": "article",
                        "material_url": None,
                        "order": 1,
                        "module_id": module_id,
                    }
                ]

            for data in data_list:
                existing = self.db.query(Lesson).filter_by(title=data["title"], module_id=module_id).first()
                if existing:
                    lessons.append(existing)
                    continue

                lesson = Lesson(**data)
                self.db.add(lesson)
                lessons.append(lesson)

        try:
            self.db.commit()
            Colors.success(f"✓ {len(lessons)} lesson(s) seeded")
        except Exception as e:
            self.db.rollback()
            Colors.error(f"✗ Error seeding lessons: {e}")
            return []

        return lessons



        return lessons
