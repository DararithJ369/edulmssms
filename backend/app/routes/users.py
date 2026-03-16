from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.user_service import UserService
from app.schemas.user import UserCreate, UserUpdate, UserResponse

user_router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


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


@user_router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(user_id: str, db: Session = Depends(get_db)):
    user = UserService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@user_router.get("", response_model=dict)
def get_all_users(db: Session = Depends(get_db), page: int = 1, limit: int = 10):
    return UserService.get_users(db, page, limit)


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