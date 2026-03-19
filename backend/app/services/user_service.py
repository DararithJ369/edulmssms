from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.role import Role
from app.schemas.user import UserCreate, UserUpdate, LoginRequest, UserResponse
from fastapi import HTTPException, UploadFile
from app.utils.argon2 import hash_password, verify_password
from app.utils.get_image import get_image

class UserService:
    
    @staticmethod
    def login(db: Session, login_request: LoginRequest) -> UserResponse:
        user = db.query(User).filter(func.lower(User.email) == func.lower(login_request.email)).first()
        
        if not user or not verify_password(user.hashed_password, login_request.password):  # type: ignore[arg-type]
            raise HTTPException(status_code=400, detail="Invalid email or password")
        
        return UserResponse.model_validate(user)
    
    
    @staticmethod
    def setup_form(db: Session) -> dict:
        roles = db.query(Role).all()
        
        role_options = [{"value": role.id, "label": role.name} for role in roles]
        
        return {
            "roles": [
                {"value": role.id, "label": role.name} for role in roles
            ],
            "fields": {
                "email": {
                    "type": "string",
                    "required": True,
                },
                "password": {
                    "type": "string",
                    "required": True,
                },
                "role_id": {
                    "type": "select",
                    "options": role_options,
                    "required": True,
                },
                "image": {
                    "type": "file",
                    "required": False,
                },
            }
        }
        
    @staticmethod
    def create_user(db: Session, user_in: UserCreate, image: Optional[UploadFile] = None) -> UserResponse:
        existing_user = db.query(User).filter(func.lower(User.email) == func.lower(user_in.email)).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        if user_in.password:
            hashed_password = hash_password(user_in.password)
        else:
            raise HTTPException(status_code=400, detail="Password is required")
        
        role = db.query(Role).filter(Role.id == user_in.role_id).first()
        if not role:
            raise HTTPException(status_code=400, detail="Invalid role_id")
        
        new_user = User(
            email=user_in.email,
            username=user_in.username,
            hashed_password=hashed_password,
            is_active=True,
            is_superuser=False
        )
        
        if image:
            new_user.image = get_image(image)  # type: ignore[attr-defined]
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return UserResponse.model_validate(new_user)
    
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> UserResponse:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserResponse.model_validate(user)
    
    
    @staticmethod
    def get_users(db: Session, page: int, limit: int):
        total = db.query(func.count(User.id)).scalar()
        
        users = (
            db.query(User)
            .order_by(User.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        
        return {
            "data": [UserResponse.model_validate(user) for user in users],
            "meta": {
                "page": page,
                "total": total,
                "limit": limit,
            }
        }
        
    
    @staticmethod
    def update_user(db: Session, user_id: str, user_in: UserUpdate, image: Optional[UploadFile] = None) -> UserResponse:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user_in.email:
            existing_user = db.query(User).filter(func.lower(User.email) == func.lower(user_in.email), User.id != user_id).first()
            if existing_user:
                raise HTTPException(status_code=400, detail="Email already registered")
            user.email = user_in.email  # type: ignore[attr-defined]
        
        if user_in.username:
            user.username = user_in.username  # type: ignore[attr-defined]
        
        if user_in.password:
            user.hashed_password = hash_password(user_in.password)  # type: ignore[attr-defined]
        
        if user_in.role_id:
            role = db.query(Role).filter(Role.id == user_in.role_id).first()
            if not role:
                raise HTTPException(status_code=400, detail="Invalid role_id")
            user.role_id = user_in.role_id  # type: ignore[attr-defined]
        
        if image:
            user.image = get_image(image)  # type: ignore[attr-defined]
        
        if user_in.is_active is not None:
            user.is_active = user_in.is_active  # type: ignore[attr-defined]
            
        update_data = user_in.dict(exclude_unset=True, exclude_none=True)
        for key, value in update_data.items():
            setattr(user, key, value)
        
        db.commit()
        db.refresh(user)
        
        return UserResponse.model_validate(user)
    
    
    @staticmethod
    def delete_user(db: Session, user_id: str):
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            db.rollback()
            raise HTTPException(status_code=404, detail="User not found")
        
        db.delete(user)
        db.commit()
        return {"detail": "User deleted"}