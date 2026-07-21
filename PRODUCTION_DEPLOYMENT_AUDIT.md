# Production Deployment Readiness Audit — LMS + SMS Platform

**Audit Date:** 2026-07-06  
**Auditor:** Cascade (Senior Software Architect / DevOps / Security / QA)  
**Scope:** FastAPI backend, Next.js frontend, PostgreSQL/Alembic, Auth/RBAC, file uploads/storage, email/password reset, pagination/performance, security controls, build/deployment, and video architecture (Mux readiness).

---

## 1. Executive Verdict

| Deployment Type | Readiness | Notes |
| --- | --- | --- |
| **Production** | **NOT READY** | Several security, configuration, and video-delivery blockers must be resolved before any public/production deploy. |
| **Staging / QA** | **READY WITH FIXES** | Can be deployed to staging after addressing the critical/high items listed below. |
| **Internal / Demo** | **READY NOW** | Works locally and in Docker for presentations with seeded data, provided the audience is trusted. |

**Top blockers for production:**
1. CORS is wide open (`allow_origins=["*"]`).
2. Cloudinary credentials and upload preset are hardcoded in backend and frontend.
3. Video streaming endpoint uses a hardcoded developer path and bypasses enrollment checks.
4. Auth cookies/tokens are stored in `localStorage` and cookies without `Secure` / `HttpOnly` flags.
5. Public `/uploads` mount serves files without authentication.
6. Password hashing is inconsistent (bcrypt in `security.py`, argon2 in `auth.py` / `users.py` / `user_service.py`).
7. File upload size limits conflict (10 MB vs 50 MB).
8. No `.env.example` file exists; real `.env` files are in the workspace and at risk of being committed.
9. Docker/frontend image still references `npx prisma migrate deploy` and builds `npm run dev` fallback in a comment.
10. The video system is sufficient for a demo but not for production scale or security.

---

## 2. Backend Audit — FastAPI

### 2.1 General Configuration

- `backend/app/main.py` — FastAPI app entry point.
- `Base.metadata.create_all()` is commented out, relying on Alembic migrations. This is correct for production.
- Startup event runs a one-off migration `migrate_lessons_to_materials()` that uses a hardcoded fallback UUID (`3f835ba3-bcb0-4ed0-a12c-8d7ae40e97c3`) for `uploaded_by`. This is brittle and will fail in any fresh environment where that UUID does not exist.

### 2.2 CORS — Critical

```python
# backend/app/main.py:126-132
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change later in production
    ...
)
```

- **Finding:** `allow_origins=["*"]` with `allow_credentials=True` is a security vulnerability. It lets any website make authenticated cross-origin requests.
- **Fix:** Read `BACKEND_CORS_ORIGINS` from settings and enforce an explicit allow-list.

### 2.3 Environment Variables

- `backend/app/config/config.py` uses `pydantic_settings` with an `.env` file. Required keys are declared.
- **Finding:** No `.env.example` file exists (it is 0 bytes). The real `backend/.env` contains live credentials and is currently in the workspace. It is listed in `.gitignore`, but the empty `.env.example` provides no onboarding value.
- **Fix:** Populate `backend/.env.example` with all required keys and placeholder values. Verify `backend/.env` is in `.gitignore` and never commit it.

### 2.4 JWT & Token Handling

- `backend/app/config/security.py` creates access/refresh tokens using `python-jose` + bcrypt.
- `backend/app/middleware/jwt_service.py` duplicates token creation/decode logic.
- `backend/app/routes/auth.py` uses `JWTService` directly with env vars loaded again via `load_dotenv()`.
- **Finding:** Two competing token helpers exist (`security.py` vs `jwt_service.py`). The refresh endpoint does not rotate refresh tokens.
- **Finding:** `ACCESS_TOKEN_EXPIRE_MINUTES` defaults to 8 days (`60 * 24 * 8`) in config, but the auth route reads `ACCESS_TOKEN_EXPIRE_MINUTES` from env and defaults to 60 minutes.
- **Finding:** Token claims do not include `jti`, `iss`, or `aud`.
- **Fix:** Consolidate JWT logic, shorten access token lifetime, add refresh-token rotation, and consider adding Redis blocklist for logout.

### 2.5 Password Hashing — High

- `backend/app/config/security.py` uses `bcrypt` via `passlib`.
- `backend/app/utils/argon2.py`, `backend/app/routes/auth.py`, `backend/app/routes/users.py`, and `backend/app/services/user_service.py` use `argon2`.
- **Finding:** Mixed hashing algorithms will break authentication if a user registered with bcrypt tries to log in via a path that expects argon2, or vice versa.
- **Fix:** Standardize on one algorithm (Argon2id recommended) and add a migration path for legacy hashes.

---

## 3. Frontend Audit — Next.js

### 3.1 Build & Runtime

- `frontend/package.json` uses Next.js 14.2.5, React 18, TypeScript 5.
- **Verification:** `npm run build` completed successfully. All routes compiled; static and dynamic pages are generated.
- `frontend/next.config.mjs` correctly configures remote image hostnames including `res.cloudinary.com`.
- **Finding:** `frontend/Dockerfile` still contains commented-out `npx prisma migrate deploy && npm run dev` and a build step. It is functional but messy.
- **Fix:** Clean the Dockerfile to a single, production-ready multi-stage build.

### 3.2 Authentication & Session

- `frontend/src/middleware.ts` checks `access_token` and `user_role` cookies and redirects unauthenticated users.
- `frontend/src/lib/auth.ts` stores tokens in `localStorage` AND cookies with `samesite=lax`, no `Secure`, no `HttpOnly`.
- **Finding:** Storing tokens in `localStorage` exposes them to XSS. Cookies are not `HttpOnly`/`Secure`.
- **Finding:** Role normalization maps `instructor` → `teacher`, but the backend uses `instructor` as the role name. This mismatch is managed in the frontend route map but is fragile.
- **Fix:** Move to `HttpOnly`, `Secure`, `SameSite=Lax` cookies for the access token; use `localStorage` only for non-sensitive flags if needed. Use consistent role names across backend and frontend.

### 3.3 API Client

- `frontend/src/lib/api.ts` uses Axios with automatic token refresh.
- **Finding:** The request interceptor contains a hardcoded regex block `\/(students|users|parents)\/1(\/|$)` to abort "mock requests." This is a hack that can break legitimate requests to user ID `1`.
- **Finding:** The refresh interceptor only reads `localStorage`, while the middleware uses cookies. If cookies are used without localStorage, refresh silently fails.
- **Fix:** Remove the hardcoded regex block. Unify token retrieval from cookies or a single source of truth.

---

## 4. Database, Schema & Migrations

### 4.1 SQLAlchemy Models

- Models are well-structured and use `lazy="selectin"` on most relationships, which helps prevent N+1 queries.
- There are ~40 model files covering users, profiles, academics, courses, enrollments, attendance, submissions, quizzes, results, finance, notifications, audit logs, etc.
- **Finding:** `permission.py` imports `Base` from `app.db.base`, while most other models import from `app.config.base`. `app.db.base` re-exports `app.config.base.Base`, so the registries are the same, but this inconsistency is confusing and could lead to future errors.
- **Fix:** Standardize all models to import `Base` from a single location.

### 4.2 Alembic Migrations

- `backend/alembic/env.py` imports `Base` from `app.db.base` and imports all models.
- `backend/alembic/versions/88db4dab6490_0001_initial_base_tables.py` creates every table via `Base.metadata.create_all(bind=bind)`. This is acceptable for an initial baseline but is non-idiomatic and makes future autogenerate harder to trust.
- The migration chain includes a merge point (`ba67b685a074_merge_heads.py`) and resolves to head `dd45db2ba7e5`.
- **Verification:** `alembic history` resolves correctly when `PYTHONPATH` includes the backend directory.
- **Finding:** Running `alembic current` from the workspace without `PYTHONPATH` set fails because the migration script imports `app.db.base`. This means the documented `docker compose exec backend alembic upgrade head` command is correct, but local ad-hoc migration commands need care.
- **Fix:** Add `sys.path` manipulation in the initial migration script or document the required `PYTHONPATH`.

### 4.3 Indexes & Performance

- `dd45db2ba7e5_add_password_reset_and_performance_indexes.py` adds indexes on hot foreign keys and date columns:
  - `idx_assignments_course_id`, `idx_quizzes_course_id`, `idx_modules_course_id`, `idx_lessons_module_id`
  - `idx_enrollments_student_course`, `idx_user_profiles_class_id`, `idx_attendance_student_id`
  - date-sorted indexes on `assignments`, `quizzes`, `exams`, `results`, `attendance`
- **Finding:** Additional indexes are recommended for high-cardinality tables: `submissions.student_id`, `results.student_id`, `student_video_progress.student_id`, `student_lesson_views.student_id`, `notifications.user_id`, `audit_logs.user_id`.
- **Finding:** Pagination uses `OFFSET/LIMIT` everywhere. For large tables, keyset pagination is preferable.
- **Fix:** Add covering indexes for the most common query patterns. Consider keyset pagination for activity feeds.

### 4.4 Connection Pooling

- `backend/app/config/session.py` uses `pool_pre_ping=True` and `connect_args={"options": "-c timezone=utc"}`. Good for production.
- No connection pool size or `pool_recycle` is configured. For production, configure `pool_size`, `max_overflow`, and `pool_recycle`.

---

## 5. Authentication & RBAC

### 5.1 RBAC Model

- Roles: `admin`, `instructor`, `student`, `parent`.
- Permissions table and `role_permissions` pivot exist.
- `PermissionGuard` provides `admin_only`, `admin_or_instructor`, `has_permission`, and `can_view_student`.

### 5.2 RBAC Issues

- **Finding:** Many routes rely on role-name string checks (e.g., `current_user.role.name.lower()`) rather than permission keys. This is hardcoded in multiple routes and services.
- **Finding:** `PermissionGuard.admin_or_instructor` also accepts `"teacher"`, but the seeded role is `"instructor"`. The frontend normalizes `instructor` → `teacher`.
- **Finding:** The `users.py` create endpoint has a redundant admin check (`if current_user.role.name.lower() != "admin"`) in addition to the `PermissionGuard.admin_only` dependency.
- **Fix:** Move to permission-based checks using the `permissions` table. Remove role-name string checks from route logic.

### 5.3 Route Authorization Gaps

- **Finding:** `/courses/{course_id}/lessons` and `/courses/{course_id}/modules` are public (no auth dependency). Any unauthenticated user can enumerate course content.
- **Finding:** `/lessons` collection and `/lessons/{lesson_id}` are public.
- **Finding:** `/courses` list is public, which is intentional for a catalog, but the `is_published` filter is optional.
- **Fix:** Add authentication/authorization to course content and lesson endpoints, or at least enforce `is_published=True` for anonymous users.

---

## 6. File Uploads, Storage & Cloudinary

### 6.1 Current Upload Flow

- User/lesson images: uploaded to Cloudinary unsigned preset `lms_preset` via `backend/app/utils/get_image.py`.
- Lesson materials: uploaded via `backend/app/routes/lessons.py` to Cloudinary `folder="lms_classroom_materials"`.
- Submissions: uploaded via `backend/app/routes/submissions.py` to Cloudinary `folder="lms_submissions"`.
- File manager: `backend/app/services/file_manager.py` also calls Cloudinary.
- Storage service: `backend/app/services/storage.py` has logic for local/S3/CloudFront but the actual upload methods hardcode Cloudinary.

### 6.2 Critical Issues

- **Hardcoded Cloudinary credentials:** `cloud_name="dlykcgjdh"`, `upload_preset="lms_preset"` appear in:
  - `backend/app/services/storage.py`
  - `backend/app/utils/get_image.py`
  - `backend/app/routes/lessons.py`
  - `backend/app/routes/submissions.py`
  - `frontend/.env.local` (duplicated)
- **Unsigned upload preset:** Anyone with the preset name can upload to the Cloudinary account. This is a supply-chain/security risk.
- **STORAGE_PROVIDER ignored:** `backend/app/config/config.py` supports `local`, `s3`, `r2`, `minio`, but `backend/app/services/storage.py` always uses Cloudinary regardless of `STORAGE_PROVIDER`.
- **Public file serving:** `app.mount("/uploads", StaticFiles(directory=uploads_path), ...)` serves the uploads directory without authentication. If local storage is used, private files become public.
- **Private file endpoint:** `/api/v1/storage/private/{file_path}` exists and performs authorization checks, but it is not used consistently.
- **Conflicting size limits:** `backend/app/config/config.py` sets `MAX_FILE_SIZE = 50 MB`; `backend/app/utils/upload_validator.py` and `backend/app/services/file_manager.py` enforce `10 MB`.
- **Video upload limit:** `upload_validator.py` only allows `.mp4` and `video/mp4`. Modern formats (WebM, MOV) are rejected.
- **Fix:**
  1. Move Cloudinary credentials to environment variables and use signed uploads.
  2. Make `StorageService` respect `STORAGE_PROVIDER`.
  3. Remove the public `/uploads` mount or gate it behind the same authorization as `/storage/private`.
  4. Unify `MAX_FILE_SIZE` and raise video limits (e.g., 500 MB with chunked/transcoded upload).
  5. Add virus/malware scanning for user uploads.

---

## 7. Email & Password Reset

### 7.1 Password Reset Flow

- `backend/app/routes/auth.py` implements `/forgot-password`, `/verify-reset-code`, `/reset-password`.
- Generates a 6-digit OTP stored in `users.reset_code` with a 15-minute expiration.
- `backend/app/utils/email.py` sends the email via SMTP using `settings`.

### 7.2 Issues

- **Finding:** No rate limiting on `/forgot-password` or `/reset-password`. An attacker can spam password-reset emails or brute-force the 6-digit OTP.
- **Finding:** The login endpoint has a simple in-memory rate limiter (`5 attempts / 60 seconds`). This is per-process and reset on restart, so it is ineffective in multi-replica deployments.
- **Finding:** `send_password_reset_email` leaks the exact OTP to the user via email; no magic-link option.
- **Finding:** Email verification link `send_verification_email` hardcodes `http://localhost:3000`.
- **Fix:** Add rate limiting backed by Redis or the database. Use longer, cryptographically random tokens for password reset. Make verification links configurable via env vars.

---

## 8. Pagination & Performance

### 8.1 Pagination

- Most list endpoints implement offset/limit pagination with a `meta` object.
- Examples: `UserService.get_users`, `CourseService.get_courses`, `LessonService.get_lessons`, `SubmissionService.get_submissions`.
- **Finding:** Some endpoints return `List[Model]` without pagination (e.g., `/submissions/my`, `/submissions/reference/{sub_type}/{ref_id}`). For instructors with many courses, this can be large.
- **Finding:** `get_course_modules` loads all modules and lessons into a single nested response without pagination.
- **Fix:** Add pagination, limit nested depth, or use cursor pagination for activity feeds.

### 8.2 N+1 & Querying

- Most relationships use `lazy="selectin"`, which is good.
- `LessonService.get_lessons` uses `joinedload` for `module.course`.
- Some endpoints manually query child tables (e.g., `lesson_service.py` queries `materials`, `quizzes`, `assignments` separately by `lesson_id`). This is fine but could be batched.
- **Fix:** Use SQLAlchemy `selectinload` for nested collections where possible to avoid extra queries.

---

## 9. Security Controls

| Control | Status | Notes |
| --- | --- | --- |
| HTTPS / TLS | Not enforced | No HSTS or HTTPS redirect middleware. |
| CORS | Vulnerable | `allow_origins=["*"]` in production code. |
| CSP | Missing | No Content-Security-Policy headers. |
| XSS | Partial | Frontend uses React, which helps, but `target` URLs are rendered into `<iframe src>` and `<video src>` without allow-list validation. |
| CSRF | Partial | API uses Bearer tokens; cookie auth is not used server-side. |
| Cookies | Vulnerable | No `HttpOnly`, `Secure`, or `SameSite=Strict`. |
| Secrets Management | Poor | Cloudinary credentials and JWT secret are hardcoded or in `.env` in workspace. |
| Input Validation | Partial | File upload validator whitelists extensions/MIME. Some endpoints use `Form` without Pydantic validation. |
| Audit Logging | Present | `AuditLogService` logs login, user changes, etc. |
| Rate Limiting | Weak | In-memory only, single-process. |
| Dependency Scanning | Missing | No `pip-audit` or `npm audit` step documented. |
| Log Injection | Partial | Some `print()` statements instead of structured logging. |

**Fix:** Add Helmet-style headers, enforce HTTPS, strengthen cookies, move secrets to a vault/parameter store, add Redis-backed rate limiting, and run dependency audits in CI.

---

## 10. Build & Deployment Configuration

### 10.1 Docker

- `backend/Dockerfile` is simple and production-oriented: `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
- **Finding:** It does not run migrations as part of startup; the README instructs to run `alembic upgrade head` manually after `docker compose up`. This is fine for controlled deploys but requires CI/CD orchestration.
- **Finding:** `frontend/Dockerfile` has conflicting commands and a commented-out dev command. It builds and then runs `npm start`, which is correct, but the file should be cleaned.
- **Fix:** Use multi-stage builds for frontend and backend. Run migrations in a separate job or init container.

### 10.2 docker-compose

- `docker-compose.yml` is in `.gitignore` and was not inspected during this audit. It must be committed to source control or provided as a deployment artifact.
- **Fix:** Ensure `docker-compose.yml` is tracked (without secrets) and includes health checks for the backend and PostgreSQL.

### 10.3 Health Checks

- No dedicated health-check endpoint exists.
- **Fix:** Add `/health` and `/health/db` endpoints and wire them into Docker `HEALTHCHECK`.

---

## 11. Video Architecture Review

### 11.1 Current Video Implementation

**Upload pipeline:**
1. Instructor/admin uploads a video file or provides a YouTube/Cloudinary URL through the lesson form.
2. If a file is uploaded, `backend/app/routes/lessons.py` or `backend/app/routes/submissions.py` calls `cloudinary.uploader.unsigned_upload(...)` with `resource_type="video"` and a hardcoded `folder`.
3. The returned `secure_url` is stored in `lesson_materials.file_url` or `lessons.material_file` / `material_url`.

**Playback pipeline:**
1. `frontend/src/app/(dashboard)/student/lessons/[id]/page.tsx` renders the active material.
2. If the URL is YouTube, it embeds `https://www.youtube.com/embed/{id}`.
3. If the material type is `video`/`mp4`, it renders a standard HTML5 `<video src={target} controls autoPlay>`.
4. The `src` is the Cloudinary URL or a public `/uploads` path.

**Video progress tracking:**
- `backend/app/routes/video_learning.py` provides `/lessons/{id}/video/stream`, `/video/progress` (GET/POST), and `/video/notes`.
- `backend/app/models/video_progress.py` stores `student_id`, `lesson_id`, `current_time`, `duration`, `completed`.
- The actual player page uses the generic `<video>` tag and does not appear to call the streaming endpoint; the streaming endpoint is likely dead code for Cloudinary-hosted files.

**Current architecture diagram (simplified):**

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Instructor / Admin                          │
│                      (Next.js dashboard)                            │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         FastAPI Backend                             │
│  • POST /lessons/{id}/materials  → Cloudinary unsigned upload       │
│  • stores secure_url in lesson_materials.file_url                    │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Cloudinary CDN                              │
│  • Public/transformation URLs for MP4 / image / raw files            │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Student Browser                             │
│  • HTML5 <video> or YouTube iframe                                   │
│  • Progress POST /lessons/{id}/video/progress                        │
└─────────────────────────────────────────────────────────────────────┘
```

### 11.2 Current Playback Limitations

- **No adaptive bitrate (ABR):** A single MP4 file is delivered. Students on slow connections will buffer.
- **No CDN edge optimization for video:** Cloudinary serves the file, but the player does not request HLS/DASH.
- **Security:** Cloudinary URLs are public. Anyone with the URL can download the video. This is acceptable for free content but not for paid/secure courses.
- **Scalability:** Cloudinary bandwidth and storage costs can grow quickly. The unsigned upload preset also allows abuse.
- **Large file handling:** Uploads are limited to 10 MB and `.mp4` only. Real course videos are much larger.
- **Hardcoded streaming endpoint:** `backend/app/routes/video_learning.py` has a hardcoded absolute path `/Users/mac/Documents/.../backend` and does not verify enrollment. It is not currently used by the frontend but is a liability.

### 11.3 Mux Readiness Assessment

**Why Mux would help:**
- Automatic transcoding to HLS/DASH with adaptive bitrate.
- Signed playback URLs for DRM-like access control.
- Better analytics, thumbnails, and delivery performance.
- Removes the need for Cloudinary video uploads and unsigned presets.

**Future Mux architecture diagram (simplified):**

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Instructor / Admin                          │
│                      (Next.js dashboard)                            │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         FastAPI Backend                             │
│  • POST /lessons/{id}/video/upload → direct upload or Mux URL        │
│  • Webhook handler for Mux `video.asset.ready`                      │
│  • Store playback_id in lesson_materials.mux_playback_id              │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            Mux                                      │
│  • Upload / ingest → transcode → HLS/DASH manifests                 │
│  • Signed playback URLs per request                                │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Student Browser                             │
│  • Mux Player (React) loads signed playback URL + metadata            │
│  • Progress POST /lessons/{id}/video/progress (existing)            │
└─────────────────────────────────────────────────────────────────────┘
```

### 11.4 Migration Complexity Estimate

| Task | Complexity | Effort |
| --- | --- | --- |
| Add Mux SDK + env vars | Low | ~2 h |
| New `mux_playback_id` / `mux_asset_id` fields on `lesson_materials` | Low | ~2 h |
| Backend upload endpoint (direct or Mux URL) | Medium | ~4 h |
| Webhook handler for asset status | Medium | ~4 h |
| Frontend Mux Player integration | Medium | ~6 h |
| Signed playback URL generation | Medium | ~4 h |
| Enrollment check before playback URL | Medium | ~2 h |
| Migration of existing Cloudinary videos | High | ~1–2 days (re-upload or export) |
| Testing & fallback for existing content | Medium | ~1 day |

**Total rough estimate:** 2–3 days for a single developer, assuming no video migration is required and the existing Cloudinary content remains accessible.

### 11.5 Database Changes Required

```sql
-- Proposed additions (do NOT implement this sprint)
ALTER TABLE lesson_materials
  ADD COLUMN mux_asset_id VARCHAR(255),
  ADD COLUMN mux_playback_id VARCHAR(255),
  ADD COLUMN mux_upload_id VARCHAR(255),
  ADD COLUMN mux_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN duration_seconds FLOAT;
```

No changes are required for the existing schema to keep the current Cloudinary flow. Mux fields can be added later as optional columns.

### 11.6 Recommended Deployment Strategy for Video

- **Before presentation:** Keep the current system. It works for demo scenarios with small videos and YouTube embeds.
- **After presentation / before production:** Evaluate Mux (or Cloudflare Stream / AWS Elemental) if the product will host original video content behind a paywall. Mux is the lowest-friction option for a FastAPI + Next.js stack.
- **Never implement Mux if:** The product will always use third-party links (YouTube, Vimeo) and never host original video.

### 11.7 Verdict on Current Video System

- **Sufficient for demo / internal:** Yes.
- **Sufficient for production launch with original video content:** No. The public URLs, lack of ABR, 10 MB upload limit, and unsigned upload preset are blockers.
- **Mux recommendation:** Recommended for post-presentation, pre-production if video is a core feature. Not required for the demo.

---

## 12. Prioritized Remediation Roadmap

### P0 — Production Blockers (fix before any public deploy)

1. Lock down CORS to explicit origins.
2. Move Cloudinary credentials from code to environment variables and use signed uploads.
3. Remove the hardcoded path in `/lessons/{id}/video/stream` and fix enrollment check.
4. Remove the public `/uploads` static mount or protect it.
5. Standardize password hashing on Argon2id.
6. Set `Secure` / `HttpOnly` / `SameSite=Lax` for auth cookies and stop storing tokens in `localStorage`.
7. Add a real `.env.example` and ensure `.env` files are excluded from commits.
8. Unify file upload size limits and raise video limits.

### P1 — High Priority (fix before staging)

9. Add Redis-backed rate limiting for auth and password reset.
10. Consolidate JWT logic and implement refresh-token rotation.
11. Add permission-based authorization and remove role-name string checks.
12. Add auth/authorization to course content and lesson endpoints.
13. Add `/health` and `/health/db` endpoints.
14. Clean up the frontend Dockerfile and add multi-stage builds.
15. Add CSP, HSTS, and other security headers.

### P2 — Medium Priority (fix before production)

16. Add more database indexes for high-cardinality tables.
17. Implement cursor/keyset pagination for large lists.
18. Add input validation for all `Form`-based endpoints.
19. Add dependency scanning (`pip-audit`, `npm audit`) to CI.
20. Add structured logging and centralized log aggregation.

### P3 — Post-Presentation / Future

21. Evaluate Mux for video hosting and implement if original video is a core feature.
22. Add automated tests (unit, integration, E2E).
23. Set up CI/CD pipelines for build, test, migration, and deploy.
24. Add observability (metrics, error tracking, APM).

---

## 13. Deployment Readiness Matrix

| Area | Demo | Staging | Production |
| --- | --- | --- | --- |
| FastAPI backend | ✅ | ✅ after P0/P1 | ❌ until P0/P1 fixed |
| Next.js frontend build | ✅ | ✅ | ✅ |
| PostgreSQL schema | ✅ | ✅ | ✅ |
| Alembic migrations | ✅ | ✅ after PYTHONPATH doc | ✅ after doc |
| Auth & RBAC | ✅ | ⚠️ | ❌ until P0/P1 fixed |
| File uploads | ✅ | ⚠️ | ❌ until storage fixed |
| Cloudinary integration | ✅ | ⚠️ | ❌ until signed uploads |
| Email / password reset | ✅ | ⚠️ | ❌ until rate limiting |
| Pagination | ✅ | ✅ | ⚠️ |
| Database indexes | ✅ | ✅ | ⚠️ |
| Security controls | ⚠️ | ❌ | ❌ |
| Build / Docker | ✅ | ⚠️ | ⚠️ |
| Video system | ✅ | ✅ | ❌ |

**Legend:** ✅ Ready / ⚠️ Needs attention / ❌ Not ready

---

## 14. Quick Verification Commands

The following commands were run during this audit:

```bash
# Backend import check
cd /Users/mac/Documents/School\ ITC/Year3/wdim/lms-fastapi/backend
./.venv/bin/python -c "from app.main import app; print('Backend imports OK')"

# Alembic migration history
cd /Users/mac/Documents/School\ ITC/Year3/wdim/lms-fastapi/backend
PYTHONPATH=/Users/mac/Documents/School\ ITC/Year3/wdim/lms-fastapi/backend \
  ./.venv/bin/alembic history

# Frontend build
cd /Users/mac/Documents/School\ ITC/Year3/wdim/lms-fastapi/frontend
npm run build
```

Results:
- Backend imports: OK.
- Alembic history: resolves to head `dd45db2ba7e5`.
- Frontend build: successful, all routes compiled.

---

## 15. Final Recommendation

**Do not deploy to production yet.** The application is functional and suitable for an internal demo or a tightly controlled staging environment, but the security and configuration gaps are too significant for a public production launch.

**Recommended path:**
1. Deploy to a private staging environment after fixing the P0/P1 items.
2. Run a security hardening pass and penetration-test checklist.
3. Decide on a video strategy (keep Cloudinary for demo, plan Mux for post-presentation).
4. Re-audit before production.

**Mux recommendation:** Do not migrate to Mux before the presentation. The current Cloudinary + YouTube player works for the demo. After the presentation, if the product will host original video content at scale, adopt Mux as a 2–3 day post-presentation enhancement.
