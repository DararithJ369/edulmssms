from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from app.config.security import get_current_user as security_get_current_user
from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.models.parent_profile import ParentProfile


class PermissionGuard:
    
    @staticmethod
    def get_current_user(
        current_user = Depends(security_get_current_user),
    ):
        return current_user
        
    
    @staticmethod
    def admin_only(current_user=Depends(security_get_current_user)):
        if current_user.role.name.lower() != "admin":
            raise HTTPException(status_code=403, detail="Admin privileges required")
        return current_user
    
    @staticmethod
    def admin_or_instructor(current_user=Depends(security_get_current_user)):
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