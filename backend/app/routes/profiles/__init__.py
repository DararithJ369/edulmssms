from fastapi import APIRouter
from .user_profiles import profile_router
from .student_profiles import student_router
from .teacher_profiles import teacher_router
from .parent_profiles import parent_router

profiles_router = APIRouter()
profiles_router.include_router(profile_router)
profiles_router.include_router(student_router)
profiles_router.include_router(teacher_router)
profiles_router.include_router(parent_router)