from fastapi import FastAPI, Depends, APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_db, settings
from app.config.logger import app_logger
from app.middleware.guard.permission import PermissionGuard
from sqlalchemy import text
from app.routes import (
    auth_router,
    user_router,
    grade_level_router,
    academic_year_router,
    class_router,
    subject_router,
    course_router,
    lesson_router,
    assignment_router,
    quiz_router,
    exam_router,
    result_router,
    enrollment_router,
    attendance_router,
    submission_router,
    dashboard_router,
    courses_management_router,
    finance_router,
    role_router,
    permission_router,
    role_permissions_router,
    announcement_router,
    progress_router,
    schedule_slot_router,
    ai_tutor_router,
    notification_router,
    video_learning_router,
    audit_log_router,
    event_router,
    analytics_router,
    certificates_router,
    storage_router,
)

from app.routes.profiles import profiles_router


public_routes = [auth_router]


from app.models import *  # ensures all tables are known

# create database tables
# Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="SMS + LMS API",
    version="1.0.0"
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response


app.add_middleware(SecurityHeadersMiddleware)


def migrate_lessons_to_materials(db):
    try:
        from app.models.course import Lesson
        from app.models.lesson_material import LessonMaterial
        
        lessons = db.query(Lesson).all()
        for l in lessons:
            if not l.material_url and not l.material_file:
                continue
            
            exists = db.query(LessonMaterial).filter(LessonMaterial.lesson_id == l.id).first()
            if exists:
                continue
                
            m_type = l.material_type or "link"
            m_type_lower = m_type.lower()
            if m_type_lower == "article":
                m_type_clean = "doc"
            elif m_type_lower not in ["pdf", "video", "doc", "link", "image"]:
                m_type_clean = "link"
            else:
                m_type_clean = m_type_lower
            
            title = f"Lecture Resource ({m_type_clean.upper()})"
            if m_type_clean == "video":
                title = "Video Lecture"
            elif m_type_clean == "pdf":
                title = "Lecture Notes PDF"
            
            course_instructor = None
            if l.module and l.module.course:
                course_instructor = l.module.course.instructor_id
            uploaded_by = course_instructor or "3f835ba3-bcb0-4ed0-a12c-8d7ae40e97c3"
            
            file_url_val = l.material_file or l.material_url or ""
            material = LessonMaterial(
                lesson_id=l.id,
                uploaded_by=uploaded_by,
                title=title,
                description=l.content or "",
                file_url=file_url_val,
                type=m_type_clean,
                is_visible=True
            )
            db.add(material)
        db.commit()
    except Exception as e:
        app_logger.warning(f"Lesson-to-material migration skipped: {e}")


@app.on_event("startup")
def startup_event():
    from app.config.session import local_session
    db = local_session()
    try:
        migrate_lessons_to_materials(db)
    finally:
        db.close()


# CORS (needed for frontend)
# Use the configured allow-list. In production, never use "*" with allow_credentials=True.
cors_origins = settings.BACKEND_CORS_ORIGINS or ["http://localhost:3000", "http://127.0.0.1:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


permission = PermissionGuard.admin_only
app_logger.info("Admin-only routes will be protected with PermissionGuard")

# Routes already have their own per-endpoint protection via @route_decorator(..., dependencies=[Depends(...)]),
# so we don't apply global protection here.

router = APIRouter(prefix="/api/v1")
router.include_router(router=auth_router)
router.include_router(router=user_router)
router.include_router(router=profiles_router)
router.include_router(router=dashboard_router)
router.include_router(router=grade_level_router)
router.include_router(router=academic_year_router)
router.include_router(router=class_router)
router.include_router(router=course_router)
router.include_router(router=courses_management_router)
router.include_router(router=subject_router)
router.include_router(router=lesson_router)
router.include_router(router=assignment_router)
router.include_router(router=quiz_router)
router.include_router(router=exam_router)
router.include_router(router=result_router)
router.include_router(router=enrollment_router)
router.include_router(router=attendance_router)
router.include_router(router=submission_router)
router.include_router(router=finance_router)
router.include_router(router=role_router)
router.include_router(router=permission_router)
router.include_router(router=role_permissions_router)
router.include_router(router=announcement_router)
router.include_router(router=progress_router)
router.include_router(router=schedule_slot_router)
router.include_router(router=ai_tutor_router)
router.include_router(router=notification_router)
router.include_router(router=video_learning_router)
router.include_router(router=audit_log_router)
router.include_router(router=event_router)
router.include_router(router=storage_router)
router.include_router(router=analytics_router)
router.include_router(router=certificates_router)



# Serve static files from the "public" directory only (frontend assets)
from pathlib import Path
public_path = str(Path(__file__).parent / "public")

# NOTE: The /uploads mount has been removed. Private files must be accessed
# through the authenticated /api/v1/storage/private endpoint.
app.mount("/public", StaticFiles(directory=public_path), name="public")

app.include_router(router)
@app.get("/", response_class=HTMLResponse)
def home():
    html_path = "app/index.html"
    with open(html_path, "r", encoding="utf-8", errors="replace") as f:
        html_content = f.read()
    return HTMLResponse(content=html_content, status_code=200)


@app.get(router.prefix + "/")
def read_root(db=Depends(get_db)):
    return {"Hello": "World"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/health/db")
def health_check_db(db=Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail={"status": "unhealthy", "database": str(e)})