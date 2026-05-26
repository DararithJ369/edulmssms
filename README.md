# LMS + SMS Platform

A full‑stack Learning Management System (LMS) and School Management System (SMS) with role‑based access for admins, instructors, students, and parents. It includes academics management, LMS course delivery, and a unified Notion‑style UI.

## Features
- Role‑based access (admin/instructor/student/parent)
- Academics: classes, subjects, grades, assignments, quizzes, results, attendance
- LMS: courses, submissions, exams, public course catalog
- System settings: academic years, grade levels, roles & permissions

## Tech Stack
- **Backend:** FastAPI, SQLAlchemy, Alembic
- **Frontend:**  NextJS + TypeScript, Tailwind, shadcn/ui
- **Auth:** JWT

## Project Structure
```
backend/   # FastAPI app, models, routes, services
frontend/  # NextJS app
```

## Getting Started

### Backend
```zsh
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# configure env (see backend/.env.example if present)
python -m alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend
```zsh
cd frontend
npm install
npm run dev
```

## Notes
- Lessons are accessed through Courses (no standalone Lessons page).
- Finance module is removed from the frontend.

## License
Private/internal project.
