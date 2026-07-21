# Architecture & Relationship Design Blueprint - Hybrid LMS + SMS Portal

This architectural blueprint outlines the production-grade, highly normalized database relationship design for the hybrid Learning Management System (LMS) and School Management System (SMS). It documents how the schema is designed for scalability, zero N+1 query overhead, full referential integrity, and complete visual data synchronization with the Next.js frontend client.

---

## 1. Normalized Core Philosophy

To bridge traditional administrative school operations (SMS) with modern self-paced digital learning (LMS), the database is designed with a **highly decoupled but interconnected model structure**. 

Traditional school parameters (academic years, grades, sections, classes, and parent associations) function cleanly beside LMS parameters (subjects, courses, modules, ordered lessons, video/file materials, submissions, quizzes, and automated scoring models) without redundant duplication.

```mermaid
erDiagram
    AcademicYear ||--o{ Term : has
    GradeLevel ||--o{ Class : "groups into"
    Class ||--o{ UserProfile : registers
    Class ||--o{ ClassSession : schedules
    Subject ||--o{ Course : organizes
    Course ||--o{ Module : contains
    Course ||--o{ Enrollment : tracks
    Course ||--o{ Assignment : issues
    Course ||--o{ Quiz : publishes
    Module ||--o{ Lesson : sequences
    Lesson ||--o{ LessonMaterial : attaches
    Lesson ||--o{ Exam : schedules
    StudentProfile ||--o{ Enrollment : joins
    StudentProfile ||--o{ Attendance : marks
    StudentProfile ||--o{ Submission : uploads
    StudentProfile ||--o{ Result : earns
    TeacherProfile ||--o{ Course : instructs
    TeacherProfile ||--o{ Lesson : delivers
    TeacherProfile ||--o{ ClassSession : supervises
```

---

## 2. Table Mappings & Key Relationships

### SMS (School Management System) Components

#### A. Academic Years & Terms
- **`AcademicYear`**: Defines the active year (e.g. `2025-26`).
  - Has many `Term` / `Semester` records.
- **`Term`**: Represents individual terms (e.g. `Fall`, `Spring`) linked to an active `AcademicYear` via `academic_year_id` (ForeignKey with `ON DELETE CASCADE`).

#### B. Grades, Classes, & Sections
- **`GradeLevel`**: Standard grade years (e.g., `Year 1`, `Year 2`, `Grade 10`).
  - Has many `Class` sections.
- **`Class`**: Administrative grouping (e.g., `Grade 10 - Section A`, `Room 302`).
  - Belongs to `GradeLevel` via `grade_id`.
  - Links to `User` as supervisor via `supervisor_id` (representing the teacher/advisor).
  - Has many `UserProfile` records representing students registered in that administrative room.
  - Linked to schedules via `ClassSession`.

#### C. User Profiles & Family Mapping
- **`UserProfile`**: Core demographic profile containing full name, avatar, bio, blood type, gender, emergency contact, and address.
  - Belongs to `User` via `user_id` (unique one-to-one mapping).
  - Belongs to `Class` via `class_id` (many-to-one, allowing a student to belong to one admin class section).
- **`StudentProfile`**: Extension of `UserProfile` for students.
  - Contains student ID (`student_id`), department, enrollment date, and links to `GradeLevel` via `grade_level_id`.
  - Associated with many `ParentProfile` records via the `parent_student` many-to-many pivot table.
- **`ParentProfile`**: Extension of `UserProfile` for parents.
  - Stores occupation, relationship type (e.g., Mother, Father, Guardian), and links to multiple child profiles via the `parent_student` table.

---

### LMS (Learning Management System) Components

#### A. Subjects & Courses
- **`Subject`**: High-level academic discipline categories (e.g. `Computer Science`, `Digital Arts`).
  - Has many `Course` learning units.
- **`Course`**: Specialized syllabus programs taught under a specific `Subject` (e.g., `Full-Stack Web Development` under `Computer Science`).
  - Belongs to `Subject` via `subject_id`.
  - Belongs to `User` as instructor via `instructor_id`.
  - Has many `Module` syllabus blocks.
  - Has many `Enrollment` student records.

#### B. Course Structure (Modules & Lessons)
- **`Module`**: Sequential course modules (e.g. *Week 1 - Introduction to HTML5*).
  - Belongs to `Course` via `course_id`.
  - Contains many ordered `Lesson` units.
- **`Lesson`**: The atomic unit of learning.
  - Belongs to `Module` via `module_id`.
  - Tracks specific durations (e.g. `"90min"`), material types, and sequencing (`order`).
  - Linked to `LessonMaterial` records.

#### C. Learning Materials, Quizzes, & Assignments
- **`LessonMaterial`**: PDFs, doc sheets, embedded videos (YouTube/Vimeo URLs), and downloadable ZIP files.
  - Belongs to `Lesson` via `lesson_id` (with `ON DELETE CASCADE` to delete materials if a lesson is removed).
  - Tracks `uploaded_by` linking back to the instructor `users.id`.
- **`Assignment`** & **`Quiz`**: Coursework tasks.
  - Belongs to `Course` via `course_id`.
  - Can optionally belong to a specific `Lesson` or `Module` for granular sequencing.
  - Has many student `Submission` records.

---

### Hybrid Interconnectors (SMS + LMS)

#### A. Course Enrollments
- Students join courses through the `Enrollment` table rather than hardcoded groupings.
  - Tracks `student_profile_id`, `course_id`, `academic_year_id`, progress, and active/dropped status.
  - Connects learning progress with administrative years.

#### B. Class Sessions & Attendance
- **`ClassSession`**: Schedule blocks representing physical or digital classes.
  - Belongs to `Class` (administrative group).
  - Belongs to `Course` / `Subject` (learning unit).
  - Belongs to `User` as teacher.
  - Contains scheduled dates, start time, and end time.
- **`Attendance`**: Attendance logs.
  - Belongs to `StudentProfile` via `student_id`.
  - Belongs to `ClassSession` via `session_id` (or `course_id`), recording statuses (`present`, `absent`, `late`).

#### C. Submissions & Results
- **`Submission`**: Student coursework deliverables.
  - Tracks student ID, uploaded text/file answers, scoring, and timestamps.
- **`Result`**: Aggregated academic scores.
  - Links to `StudentProfile`, `Assignment` / `Quiz` / `Exam`, and `User` (grader), supporting scoring percentages, grades, GPA mapping, and grading feedback.

---

## 3. High-Performance Optimization Blueprint

To guarantee production-grade performance, avoid poor relational mapping, and completely eradicate N+1 database queries:

### 1. SQLAlchemy selectin / subquery loading
For all nested model relationships, we specify `lazy="selectin"`. 
- **How it works**: Instead of querying database tables row-by-row (N+1 queries), SQLAlchemy automatically intercepts relationship serializations and batch-loads child records (e.g. a course's modules and lessons) in a single optimized SQL subquery utilizing the `IN` clause.
- **Example**: `modules = relationship("Module", lazy="selectin", cascade="all, delete-orphan")`

### 2. Indexes & Constraints
- Database indexes are placed on foreign key columns (`profile_id`, `user_id`, `course_id`, `lesson_id`, `student_id`) to accelerate `JOIN` queries.
- `cascade="all, delete-orphan"` cascades deletes cleanly, preventing orphaned records if a parent course, class, or user is deleted.

---

## 4. Frontend Nesting Bridge (`prisma.ts` Interceptor)

Since the Next.js frontend client expects nested Prisma-style relationships (e.g. `student.class.name`, `course.modules`, etc.), our custom **Prisma Client Proxy** (`src/lib/prisma.ts`) acts as a high-fidelity translator:
1. Intercepts Prisma client method calls (`prisma.student.groupBy`, `prisma.attendance.findMany`, `prisma.lesson.findMany`).
2. Dispatches optimized AJAX requests to the backend FastAPI endpoints (e.g., `/courses`, `/attendance`, `/profiles`).
3. Automatically maps and nests backend REST objects into the exact hierarchical data shapes that components expect.
4. Prevents complex frontend transformations, ensuring smooth, instant state transitions and clean hydration.

---

## 5. Frontend Design System & Standardized Shared Components

To ensure visual consistency and UI clean-up across all LMS/SMS list dashboards, the layout architecture is built on top of a set of modular reusable components:

### A. Shared Visual Components
- **`PageHeader`**: Unified header component displaying the page eyebrow metadata, dynamic page titles, customizable Action buttons, and automated breadcrumbs.
- **`Avatar`**: Reusable avatar component managing profile image mapping with fallback initial letter rendering and deterministic color assignment to ensure smooth layout flows.
- **`EmptyState`**: Consolidated state indicator displaying custom icons and messages when listings or databases return empty records.
- **`StatusBadge`**: Styled badge mapping states such as 'active', 'inactive', 'passed', and 'failed' to HSL-curated color schemes.
- **`SkeletonLoaders`**: Consistent, pulsing CSS animation skeleton outlines representing cards, lists, tables, and statistics.

### B. Declarative List Filters & Sorters (`ListFilterSort`)
- Traditional hardcoded inline role selection buttons have been unified into a single declarative configuration-based `<ListFilterSort>` component.
- Supports dynamically populated relational select controls (e.g. Classes list, Grade levels) and instant sorting (e.g. name-asc, date-desc) utilizing live Next.js `useRouter` parameters.
