from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.course import Lesson, Course, Module
from app.models.lesson_material import LessonMaterial
from app.utils.colors import Colors


class LessonSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, Lesson)

    def seed_lessons(self, modules: list) -> list[Lesson]:
        """Seed lessons and materials for all modules"""
        if not modules:
            return []

        bind = self.db.bind
        if not isinstance(bind, Engine):
            Colors.warning("Database bind is not an Engine, skipping lesson seeding")
            return []
        inspector = inspect(bind)
        tables = set(inspector.get_table_names())
        if "lessons" not in tables:
            Colors.warning("Lessons table does not exist, skipping")
            return []

        # Find administrator user ID for uploads fallback
        from app.models.user import User
        admin = self.db.query(User).filter_by(username="admin").first()
        admin_id = admin.id if admin else "admin-fallback"

        # Custom lessons for core courses
        custom_lessons = {
            # Database Design & SQL
            "Relational Database Foundations & ER Modeling": [
                ("Relational Database Concepts", "Basic principles of databases, flat files vs relational databases, and data modeling.", "45min"),
                ("Entity Relationship Modeling & Diagrams", "Drawing entities, attributes, and relationships using Crow's Foot notation.", "50min"),
                ("Identifying Primary & Foreign Keys", "How primary and foreign keys establish data relationships and constraints.", "45min"),
                ("Designing Database Schemas in UML", "Building database diagrams using UML class notations.", "40min")
            ],
            "Relational Schema & Table Normalization": [
                ("Understanding Database Anomalies", "Identifying insert, update, and delete anomalies in poorly designed tables.", "45min"),
                ("Functional Dependencies & Keys", "Determining candidate, super, and composite keys in relations.", "50min"),
                ("First, Second, & Third Normal Forms", "Step-by-step table normalization to eliminate duplicate attributes.", "60min"),
                ("Boyce-Codd Normal Form (BCNF)", "Advanced normalization theory and decomposition guidelines.", "50min")
            ],
            "SQL Fundamentals": [
                ("SQL SELECT Statement & Filtering", "Basic query building, WHERE clauses, and logic operators.", "45min"),
                ("Sorting Results with ORDER BY", "Sorting data ascending and descending on single or multiple columns.", "40min"),
                ("Grouping Data with GROUP BY & HAVING", "Using aggregate groupings and conditional filtration on aggregates.", "50min"),
                ("Standard Aggregate Functions", "Practical use of SUM, AVG, COUNT, MIN, and MAX functions.", "45min")
            ],
            "Advanced SQL Queries & Relational Joins": [
                ("SQL Joins: INNER, LEFT, RIGHT, FULL", "Relating tables using matching join operations.", "50min"),
                ("Nested Subqueries & Correlated Queries", "Executing queries inside other queries to filter complex sets.", "55min"),
                ("Set Operations: UNION, INTERSECT, EXCEPT", "Combining multiple queries together using set logic.", "45min"),
                ("SQL Window Functions", "Analyzing sliding rows using ROW_NUMBER, RANK, and DENSE_RANK.", "60min")
            ],
            "Database Transactions, Indexes & Tuning": [
                ("ACID Properties & Transactions", "Ensuring database stability using COMMIT, ROLLBACK, and isolation levels.", "50min"),
                ("Database Indexes: B-Trees & Hash Indexes", "Creating indexes to accelerate database search queries.", "50min"),
                ("Reading Query Execution Plans", "Using EXPLAIN ANALYZE to analyze bottlenecks in queries.", "45min"),
                ("Database Performance Optimization", "Optimizing join structures and removing redundant execution steps.", "50min")
            ],

            # Advanced Web Development
            "HTML5 Semantics, Responsive CSS3 Grid & Flexbox": [
                ("Introduction to HTML5 Semantic Tags", "Structuring web documents for SEO and screen accessibility.", "45min"),
                ("CSS3 Flexbox Layout Guide", "Aligning items along a 1D flex axis horizontally and vertically.", "50min"),
                ("CSS Grid 2D Layouts", "Designing grids with grid-template-columns and grid-template-rows.", "55min"),
                ("Media Queries & Responsive Viewports", "Tailoring CSS styles to render beautifully across mobile and desktop screens.", "45min")
            ],
            "JavaScript ES6+ & DOM Interaction APIs": [
                ("Modern JS Syntax and Destructuring", "Using let, const, arrow functions, template literals, and destructuring.", "45min"),
                ("DOM Selection & Event Handling", "Querying HTML nodes dynamically and listening to user click/input triggers.", "50min"),
                ("Asynchronous JavaScript & Fetch API", "Leveraging promises, async/await, and query remote REST endpoints.", "55min"),
                ("Local Storage & Client Cache", "Storing variables locally to persist states across browser refreshes.", "45min")
            ],
            "Single Page App Foundations with React & Tailwind": [
                ("React Virtual DOM & JSX Rendering", "How React renders components efficiently using JSX and virtual nodes.", "45min"),
                ("Components, Props, & Reusability", "Building modular widgets and passing data down dynamically via props.", "50min"),
                ("React Hooks: useState and useEffect", "Managing local state and executing side-effect fetch operations.", "60min"),
                ("Tailwind CSS Utility Styling", "Styling React interfaces using modern utility classes.", "45min")
            ],
            "Next.js Dashboard Routing, SSR & Client Fetching": [
                ("Next.js App Router Structure", "Understanding folder-based routes, layout files, and page boundaries.", "45min"),
                ("Server Components vs Client Components", "When to render on the backend vs enabling client side interactivity.", "50min"),
                ("Data Fetching Strategies in Next.js", "Implementing Server-Side Rendering (SSR) and Incremental Static Regeneration.", "55min"),
                ("Managing Navigation & Router States", "Navigating programmatically using useRouter and Link components.", "45min")
            ],
            "REST API Integration with FastAPI & Secure Sessions": [
                ("FastAPI Path Handlers & Routing", "Setting up FastAPI route decorators and handling path parameters.", "45min"),
                ("Request Validation with Pydantic", "Enforcing strict body JSON validation using Pydantic models.", "50min"),
                ("JWT Token Bearer Authentication", "Securing API endpoints using JSON Web Tokens and credentials verify.", "55min"),
                ("Axios Integration & Cookie Storage", "Connecting the Next.js client with FastAPI and persisting auth state.", "50min")
            ]
        }

        lessons = []
        for module in modules:
            module_id = module.id
            module_title = module.title

            # Fetch course instructor to assign materials uploaded_by correctly
            course = self.db.query(Course).filter_by(id=module.course_id).first()
            instructor_id = course.instructor_id if (course and course.instructor_id) else admin_id

            # Retrieve custom lessons or generate 4 default ones
            lesson_list = custom_lessons.get(module_title, [
                (f"Introduction to {module_title}", f"General foundations and base definitions for {module_title}.", "40min"),
                (f"Core Methodologies of {module_title}", f"Key implementation steps and workflows of {module_title}.", "45min"),
                (f"Advanced Practice in {module_title}", f"Deeper dive into optimizations and troubleshooting for {module_title}.", "50min"),
                (f"Review and Assessment of {module_title}", f"Interactive review and preparation for {module_title} assessments.", "40min")
            ])

            for order_idx, (title, desc, duration) in enumerate(lesson_list, start=1):
                existing = self.db.query(Lesson).filter_by(title=title, module_id=module_id).first()
                if existing:
                    lessons.append(existing)
                    self._seed_materials_for_lesson(existing, instructor_id)
                    continue

                lesson = Lesson(
                    title=title,
                    description=desc,
                    content=f"Detailed academic reading material covering {title}. This content describes the primary workflows, implementation patterns, and theoretical analysis required for university-grade mastery.",
                    duration=duration,
                    material_type="article",
                    material_url=None,
                    material_file=None,
                    order=order_idx,
                    module_id=module_id
                )
                self.db.add(lesson)
                self.db.flush()
                lessons.append(lesson)
                self._seed_materials_for_lesson(lesson, instructor_id)

        try:
            self.db.commit()
            Colors.success(f"✓ {len(lessons)} lesson(s) and their rich materials successfully seeded")
        except Exception as e:
            self.db.rollback()
            Colors.error(f"✗ Error seeding lessons: {e}")
            return []

        return lessons

    def _seed_materials_for_lesson(self, lesson: Lesson, instructor_id: str):
        """Seed exactly 3 materials (video, pdf, link) for a lesson to prevent empty content blocks"""
        
        # 1. Video Material
        video_exists = self.db.query(LessonMaterial).filter_by(lesson_id=lesson.id, type="video").first()
        if not video_exists:
            video = LessonMaterial(
                lesson_id=lesson.id,
                uploaded_by=instructor_id,
                title=f"Video Lecture: {lesson.title}",
                description=f"Recorded lecture video introducing and demonstrating {lesson.title} concepts.",
                file_url="https://res.cloudinary.com/demo/video/upload/dog.mp4",  # Fallback dynamic video player path
                type="video",
                file_size=15240000,
                is_visible=True
            )
            self.db.add(video)

        # 2. PDF Material
        pdf_exists = self.db.query(LessonMaterial).filter_by(lesson_id=lesson.id, type="pdf").first()
        if not pdf_exists:
            pdf = LessonMaterial(
                lesson_id=lesson.id,
                uploaded_by=instructor_id,
                title=f"Lecture Slides: {lesson.title}",
                description=f"Academic slide deck and notes covering key methodologies for {lesson.title}.",
                file_url=f"https://example.com/materials/slides_{lesson.id}.pdf",
                type="pdf",
                file_size=3250000,
                is_visible=True
            )
            self.db.add(pdf)

        # 3. Document/Link Material
        link_exists = self.db.query(LessonMaterial).filter_by(lesson_id=lesson.id, type="link").first()
        if not link_exists:
            link = LessonMaterial(
                lesson_id=lesson.id,
                uploaded_by=instructor_id,
                title=f"Reference Documentation: {lesson.title}",
                description=f"Additional references, exercises, and official documentation links for {lesson.title}.",
                file_url=f"https://example.com/references/guide_{lesson.id}",
                type="link",
                file_size=1024,
                is_visible=True
            )
            self.db.add(link)

        self.db.flush()
