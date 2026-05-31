from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from datetime import timedelta
import os
from dotenv import load_dotenv
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.user_service import UserService
from app.schemas.user import User, UserCreate, UserUpdate, UserResponse, LoginRequest, Token
from app.middleware.jwt_service import JWTService
from app.config.logger import security_logger
from app.utils.device_tracker import DeviceTracker

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")

user_router = APIRouter(
    prefix="/users",
    tags=["Users"],
)

# ── Static paths (must come before /{user_id}) ────────────────────────────────

@user_router.get("/setup-form", dependencies=[Depends(PermissionGuard.admin_only)])
def setup_user_form(db: Session = Depends(get_db)):
    return UserService.setup_form(db)


@user_router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(PermissionGuard.get_current_user)):
    """Return the currently authenticated user's own profile."""
    return current_user



@user_router.get("/students", response_model=dict)
def get_students(db: Session = Depends(get_db), page: int = 1, limit: int = 10):
    """Get all users with student role - Updated"""
    return UserService.get_users_by_role(db, role_name="student", page=page, limit=limit)


@user_router.get("/instructors", response_model=dict)
def get_instructors(db: Session = Depends(get_db), page: int = 1, limit: int = 10):
    """Get all users with instructor role"""
    return UserService.get_users_by_role(db, role_name="instructor", page=page, limit=limit)


@user_router.get("/parents", response_model=dict)
def get_parents(db: Session = Depends(get_db), page: int = 1, limit: int = 10):
    """Get all users with parent role"""   
    return UserService.get_users_by_role(db, role_name="parent", page=page, limit=limit)


@user_router.get("/admins", response_model=dict, dependencies=[Depends(PermissionGuard.admin_only)])
def get_admin(db: Session = Depends(get_db), page: int = 1, limit: int = 10):
    """Get all users with admin role"""
    return UserService.get_users_by_role(db, role_name="admin", page=page, limit=limit)


@user_router.post("", response_model=UserResponse, dependencies=[Depends(PermissionGuard.admin_only)])
def create_user(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role_id: int = Form(...),
    image: Optional[UploadFile] = File(None), 
    db: Session = Depends(get_db)
):
    return UserService.create_user(db, UserCreate(
        username=username,
        email=email,
        password=password,
        role_id=role_id
    ), image)


@user_router.get("", response_model=dict, dependencies=[Depends(PermissionGuard.admin_only)])
def get_all_users(db: Session = Depends(get_db), page: int = 1, limit: int = 10):
    return UserService.get_users(db, page, limit)


@user_router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(user_id: str, db: Session = Depends(get_db)):
    user = UserService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@user_router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role_id: int = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    try: 
        user_data = UserUpdate(
            username=username,
            email=email,
            password=password,
            role_id=role_id
        )
        return UserService.update_user(db, user_id, user_data, image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    
@user_router.delete("/{user_id}", dependencies=[Depends(PermissionGuard.admin_only)])
def delete_user(user_id: str, db: Session = Depends(get_db)):
    try:
        UserService.delete_user(db, user_id)
        return {"detail": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))