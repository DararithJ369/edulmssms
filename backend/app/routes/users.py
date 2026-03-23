from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from datetime import timedelta
import os
from dotenv import load_dotenv
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.user_service import UserService
from app.schemas.user import UserCreate, UserUpdate, UserResponse, LoginRequest, Token
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


@user_router.post("/login", response_model=Token)
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = UserService.login(db, data)
        info = DeviceTracker.get_device_info(request)
        client_ip = DeviceTracker.get_client_ip(request)
        security_logger.info(f"User {user.email} logged in from IP {client_ip} with device info: {info}")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token_data = {"sub": str(user.id), "role": user.role_id}
    access_token = JWTService.create_access_token(
        data=token_data,
        secret_key=SECRET_KEY,
        algorithm=ALGORITHM,
        expires_delta=timedelta(minutes=int(ACCESS_TOKEN_EXPIRE_MINUTES)),
    )
    
    return {"access_token": access_token, "token_type": "bearer", "info": info}


@user_router.post("/logout")
def logout(current_user = Depends(PermissionGuard.get_current_user)):
    """Logout endpoint - clears user session"""
    security_logger.info(f"User {current_user.email} logged out")
    return {"message": "Logged out successfully"}


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


@user_router.get("/setup-form", dependencies=[Depends(PermissionGuard.admin_only)])
def setup_user_form(db: Session = Depends(get_db)):
    return UserService.setup_form(db)


@user_router.get("/profile", response_model=dict)
def get_user_profile(current_user = Depends(PermissionGuard.get_current_user)):
    """Get current logged-in user's profile"""
    return {
        "user": {
            "_id": current_user.id,
            "name": current_user.username,  # Frontend expects 'name' field
            "email": current_user.email,
            "role": current_user.role.name.lower() if current_user.role else "student",
        },
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username
    }


@user_router.get("/students", response_model=dict)
def get_students(db: Session = Depends(get_db), page: int = 1, limit: int = 10):
    """Get all users with student role - Updated"""
    from sqlalchemy import func
    from app.models.user import User
    from app.models.role import Role
    
    total = db.query(func.count(User.id)).join(Role).filter(Role.name.ilike("student")).scalar()
    users = db.query(User).join(Role).filter(Role.name.ilike("student")).offset((page - 1) * limit).limit(limit).all()
    
    return {
        "data": [UserResponse.model_validate(u) for u in users],
        "meta": {"page": page, "total": total, "limit": limit}
    }


@user_router.get("/instructors", response_model=dict)
def get_instructors(db: Session = Depends(get_db), page: int = 1, limit: int = 10):
    """Get all users with instructor role"""
    from sqlalchemy import func
    from app.models.user import User
    from app.models.role import Role
    
    total = db.query(func.count(User.id)).join(Role).filter(Role.name.ilike("instructor")).scalar()
    users = db.query(User).join(Role).filter(Role.name.ilike("instructor")).offset((page - 1) * limit).limit(limit).all()
    
    return {
        "data": [UserResponse.model_validate(u) for u in users],
        "meta": {"page": page, "total": total, "limit": limit}
    }


@user_router.get("/parents", response_model=dict)
def get_parents(db: Session = Depends(get_db), page: int = 1, limit: int = 10):
    """Get all users with parent role"""
    from sqlalchemy import func
    from app.models.user import User
    from app.models.role import Role
    
    total = db.query(func.count(User.id)).join(Role).filter(Role.name.ilike("parent")).scalar()
    users = db.query(User).join(Role).filter(Role.name.ilike("parent")).offset((page - 1) * limit).limit(limit).all()
    
    return {
        "data": [UserResponse.model_validate(u) for u in users],
        "meta": {"page": page, "total": total, "limit": limit}
    }


@user_router.get("/admins", response_model=dict)
def get_admins(db: Session = Depends(get_db), page: int = 1, limit: int = 10):
    """Get all users with admin role"""
    from sqlalchemy import func
    from app.models.user import User
    from app.models.role import Role
    
    total = db.query(func.count(User.id)).join(Role).filter(Role.name.ilike("admin")).scalar()
    users = db.query(User).join(Role).filter(Role.name.ilike("admin")).offset((page - 1) * limit).limit(limit).all()
    
    return {
        "data": [UserResponse.model_validate(u) for u in users],
        "meta": {"page": page, "total": total, "limit": limit}
    }


@user_router.get("", response_model=dict)
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
    id: str,
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
        return UserService.update_user(db, id, user_data, image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    
@user_router.delete("/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db)):
    try:
        UserService.delete_user(db, user_id)
        return {"detail": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))