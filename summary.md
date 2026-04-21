# Project Summary

## Overview
This repository contains a full‑stack LMS/SMS platform with a FastAPI backend and a React (Vite + TypeScript) frontend. The system supports role‑based access (admin, instructor, student, parent), academic operations, LMS course delivery, and a unified Notion‑style UI across pages.

## Tech Stack
- **Backend:** FastAPI, SQLAlchemy, Alembic
- **Frontend:** React 19, TypeScript, Vite, Tailwind, shadcn/ui, Lucide
- **Auth:** JWT‑based authentication with role guards

## Core Modules
- **Academics:** Classes, Subjects, Timetable, Grades, Assignments, Quizzes, Results, Attendance, Enrollments
- **LMS:** Courses (dashboard + public catalog), Course detail, Submissions, Exams
- **People:** Students, Instructors, Parents, Admins, User profiles
- **System:** Academic Years, Grade Levels, Roles & Permissions

## Key Features
- Role‑based navigation and permissions
- Parent access limited to linked children (grades/attendance)
- Course management with modules/lessons in backend
- Public courses and enrollment flow (no payment)
- Permissions matrix with role‑permission assignment
- Consistent Notion‑style UI and green accent palette

## Recent Changes Highlights
- Added permissions system (models/routes/UI matrix)
- Added enrollment checkout without payment
- Added submissions and enrollments pages
- Unified page backgrounds with base theme tokens
- Removed finance module from frontend
- Removed extra Markdown docs (kept README only)

## Notes
- The LMS Lessons page is accessed via Courses (no standalone LMS Lessons route).
- Pagination uses a shared component with green styling.
