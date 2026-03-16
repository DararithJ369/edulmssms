from fastapi import FastAPI, Depends, APIRouter, HTTPException, status
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import get_db, settings
from app.middleware.guard.permission import PermissionGuard
from app.routes import (
    loggin_router,
    user_router,
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
    grade_router,
    submission_router,
)
from app.routes.profiles import profiles_router


public_routes = [loggin_router]

from app.config.session import engine
from app.config.base import Base

from app.models import *  # ensures all tables are known

# create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="SMS + LMS API",
    version="1.0.0"
)


# CORS (needed for frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change later in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


permission = PermissionGuard.admin_only
print("Admin-only routes will be protected with PermissionGuard")

# Routes already have their own per-endpoint protection via @route_decorator(..., dependencies=[Depends(...)]),
# so we don't apply global protection here.

router = APIRouter(prefix="/api/v1")
router.include_router(router=loggin_router)
router.include_router(router=user_router)
router.include_router(router=profiles_router)
router.include_router(router=class_router)
router.include_router(router=course_router)
router.include_router(router=subject_router)
router.include_router(router=lesson_router)
router.include_router(router=assignment_router)
router.include_router(router=quiz_router)
router.include_router(router=exam_router)
router.include_router(router=result_router)
router.include_router(router=enrollment_router)
router.include_router(router=attendance_router)
router.include_router(router=grade_router)  
router.include_router(router=submission_router)


# Serve static files from the "uploads" directory
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/public", StaticFiles(directory="app/public"), name="public" )

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