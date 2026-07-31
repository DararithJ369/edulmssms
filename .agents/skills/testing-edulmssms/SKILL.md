---
name: testing-edulmssms
description: End-to-end testing procedure for the EduLMS application. Use when verifying backend API endpoints, frontend page rendering, or validating refactoring changes.
---

# Testing EduLMS End-to-End

## Devin Secrets Needed
None — the app uses local credentials only.

## Prerequisites
- Docker (for PostgreSQL)
- Python 3.x with pip
- Node.js with npm

## 1. Start PostgreSQL

```bash
docker run -d --name edulmssms-postgres \
  -e POSTGRES_USER=lms_user \
  -e POSTGRES_PASSWORD=lms_pass \
  -e POSTGRES_DB=lms_db \
  -p 5432:5432 postgres:15
```

If the container already exists: `docker start edulmssms-postgres`

## 2. Configure Backend

Create `backend/.env` with:
```
POSTGRES_USER=lms_user
POSTGRES_PASSWORD=lms_pass
POSTGRES_DB=lms_db
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRESQL_URI=postgresql+psycopg2://lms_user:lms_pass@localhost:5432/lms_db
SECRET_KEY=testsecretkey12345678901234567890
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_MINUTES=43200
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
FIRST_SUPERUSER_EMAIL=admin@example.com
FIRST_SUPERUSER_PASSWORD=admin123
STORAGE_PROVIDER=local
```

**Important:** `BACKEND_CORS_ORIGINS` must be a JSON array string, not a plain URL. `POSTGRESQL_URI` must be explicitly set — pydantic-settings won't auto-construct it.

## 3. Install & Start Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The backend auto-creates tables and the admin superuser on first startup.

## 4. Seed Test Data

```bash
cd backend
python3 -m app.seeders.seeder
```

This populates courses, students, teachers, assignments, quizzes, exams, events, announcements, results, attendance, and finance records.

## 5. Configure & Start Frontend

Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

## 6. Authentication

Default admin: `admin@example.com` / `admin123`

Get a JWT token via API:
```bash
curl -s -X POST http://localhost:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

Use the `access_token` in subsequent requests: `-H "Authorization: Bearer $TOKEN"`

## 7. API Test Patterns

All list endpoints return `{data: [...], meta: {page, total, limit}}` structure.

### Key Endpoints
| Endpoint | Auth Required | Notes |
|----------|--------------|-------|
| GET /api/v1/events | No | Public |
| GET /api/v1/announcements | No | Public |
| GET /api/v1/subjects | Yes | Admin/teacher |
| GET /api/v1/grade-levels | Yes | Admin |
| GET /api/v1/academic-years | Yes | Admin |
| GET /api/v1/exams | Yes | Admin/teacher |
| GET /api/v1/results | Yes | Role-filtered for students |
| GET /api/v1/attendance | Yes | Role-filtered for students |
| GET /api/v1/finance/fees | Yes | Admin only |
| GET /api/v1/finance/expenses | Yes | Admin only |
| GET /api/v1/finance/salary | Yes | Admin only (singular, not /salaries) |

### CRUD Test Template
```bash
# List
curl -s http://localhost:8000/api/v1/{resource} -H "Authorization: Bearer $TOKEN"
# Get by ID
curl -s http://localhost:8000/api/v1/{resource}/1 -H "Authorization: Bearer $TOKEN"
# 404 test
curl -s http://localhost:8000/api/v1/{resource}/9999 -H "Authorization: Bearer $TOKEN"
# Create
curl -s -X POST http://localhost:8000/api/v1/{resource} -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{...}'
# Update
curl -s -X PUT http://localhost:8000/api/v1/{resource}/{id} -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{...}'
# Delete
curl -s -X DELETE http://localhost:8000/api/v1/{resource}/{id} -H "Authorization: Bearer $TOKEN"
```

## 8. Frontend Page Verification

After login at `/login`, verify these list pages render data:
- `/list/events` — Events
- `/list/announcements` — Announcements
- `/list/subjects` — Subjects
- `/list/exams` — Exams
- `/list/assignments` — Assignments
- `/list/quizzes` — Quizzes
- `/list/results` — Gradebook/Results
- `/list/teachers` — Teachers/Lecturers
- `/list/students` — Students
- `/list/attendance` — Attendance records

## Gotchas
- The finance salary endpoint is `/finance/salary` (singular), not `/finance/salaries`
- `BACKEND_CORS_ORIGINS` must be a JSON array: `["http://localhost:3000"]`
- The backend `.venv` might not exist from snapshot — create it fresh if needed
- The seeder is idempotent but may create duplicate announcements if run multiple times
- Frontend pages use `normalizeRole` from `@/lib/auth` — if role labels don't render, check this import
