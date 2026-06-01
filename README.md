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
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# configure env (create `backend/.env` or copy from `backend/.env.example` if present)
python -m alembic upgrade head
uvicorn app.main:app --reload
```

Required backend env keys (minimum):
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_HOST`, `POSTGRES_PORT`
- `SECRET_KEY` (JWT signing)
- `JWT_ALGORITHM` (default `HS256`)
- `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_MINUTES`
- `BACKEND_CORS_ORIGINS`

### Frontend
```zsh
cd frontend
npm install
# configure env (create `frontend/.env` or `frontend/.env.local` if required)
npm run dev
```

Required frontend env keys (minimum):
- `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:8000/api/v1`)

## Notes
- Lessons are accessed through Courses (no standalone Lessons page).
- Finance module is removed from the frontend.

## License
Private/internal project.
