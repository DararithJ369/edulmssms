from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from app.services.user_service import UserService
from app.config.session import get_db
from app.middleware.jwt_service import JWTService
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.models.student_profile import StudentProfile
from app.models.user_profile import UserProfile
from app.models.parent_profile import ParentProfile
from dotenv import load_dotenv
import os

load_dotenv()

security = HTTPBearer()

class PermissionGuard:
    
    @staticmethod
    def get_current_user(
        db: Session = Depends(get_db),
        token: HTTPAuthorizationCredentials = Depends(security)
    ):
        try: 
            secret_key = os.getenv("SECRET_KEY", "")
            jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
            payload = JWTService.verify_token(
                token.credentials, 
                secret_key=secret_key, 
                algorithms=jwt_algorithm.split(",")
            )
            user_id = payload.get("sub")
            if user_id is None:
                raise HTTPException(status_code=401, detail="Invalid token")
            user = UserService.get_user_by_id(db, user_id)
            return user
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
    
    @staticmethod
    def admin_only(current_user=Depends(get_current_user)):
        if current_user.role.name.lower() != "admin":
            raise HTTPException(status_code=403, detail="Admin privileges required")
        return current_user
    
    @staticmethod
    def admin_or_instructor(current_user=Depends(get_current_user)):
        if current_user.role.name.lower() not in ["admin", "instructor", "teacher"]:
            raise HTTPException(status_code=403, detail="Admin, Instructor or Teacher privileges required")
        return current_user

    @staticmethod
    def has_permission(db: Session, role_id: int, permission_key: str) -> bool:
        permission = db.query(Permission).filter(Permission.key == permission_key).first()
        if not permission:
            return False
        return (
            db.query(RolePermission)
            .filter(RolePermission.role_id == role_id, RolePermission.permission_id == permission.id)
            .first()
            is not None
        )

    @staticmethod
    def can_view_student(db: Session, current_user, student_user_id: str) -> bool:
        role = current_user.role.name.lower()
        if role in ["admin", "instructor", "teacher"]:
            return True

        if role == "student" and str(current_user.id) == str(student_user_id):
            return True

        if role == "parent":
            if not current_user.profile or not current_user.profile.parent_profile:
                return False
            parent_profile: ParentProfile = current_user.profile.parent_profile
            for student in parent_profile.students:
                if student.profile and str(student.profile.user_id) == str(student_user_id):
                    return True
        return False