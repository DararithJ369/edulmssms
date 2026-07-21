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
#### Option A: Docker (recommened)
*Prerequisites: Docker Desktop installed and running.*

```zsh
# Clone and enter the project
git clone <repo-url>
cd edulmssms

# Create the backend env file
cp backend/.env.example backend/.env
# Edit backend/.env — at minimum fill in:
#   POSTGRES_PASSWORD, SECRET_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SMTP_PASSWORD

# Generate a secure SECRET_KEY
openssl rand -hex 32

# Start the containers
docker compose up -d --build

# Run the migrations sequentially
docker compose exec backend alembic upgrade head

# Seed the database
docker compose exec backend python app/db/seed/run_seeder.py seed
```

API is live at http://localhost:8000 · Docs at http://localhost:8000/docs

> **Note:** If you've run this project before under a different name, stale volumes can cause auth failures. Run `docker volume ls | grep postgres` and remove any leftover volumes with `docker volume rm <name>` before starting.

#### Option B: Local development
*Prerequisites: Python 3.11+, a running PostgreSQL instance, Node.js 18+.*

```zsh
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Create and fill in backend/.env (see required keys below)
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

### Seed the database

After the containers are up and healthy, run:

```bash
# First-time setup — seed all data
docker compose exec backend python app/db/seed/run_seeder.py seed

# Reset the database and re-seed from scratch
docker compose exec backend python app/db/seed/run_seeder.py reset-seed

# Reset only (wipes all data, no re-seed)
docker compose exec backend python app/db/seed/run_seeder.py reset
```

This seeds the following data:

- **Roles** — admin, instructor, student, parent
- **Users** — 1 admin, 5 instructors, 20 students, 5 parents (with profiles)
- **Academic** — academic years, grade levels, subjects, courses, modules, lessons
- **Activity** — enrollments, assignments, quizzes, exams, attendance, submissions, results
- **Other** — announcements, finance records

Default admin credentials are set via `FIRST_SUPERUSER_EMAIL` and `FIRST_SUPERUSER_PASSWORD` in your `.env`.

## Notes
- Lessons are accessed through Courses (no standalone Lessons page).
- Finance module is removed from the frontend.
- **Frontend Refactoring & Component Library**:
  - All dashboard view listing pages are standardized to use `<PageHeader>` and `<ListFilterSort>`.
  - Reusable avatar and status indicator states have been modularized under `<Avatar>` and `<StatusBadge>`.
  - Staged loading animations and null records utilize `<SkeletonLoaders>` and `<EmptyState>` respectively.

## License
Private/internal project.
