from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from app.services.user_service import UserService
from app.config.session import get_db
from app.middleware.jwt_service import JWTService
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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
        except Exception as e:
            raise HTTPException(status_code=401, detail=str(e))
        
    
    @staticmethod
    def admin_only(current_user=Depends(get_current_user)):
        if current_user.role.name.lower() != "admin":
            raise HTTPException(status_code=403, detail="Admin privileges required")
        return current_user
    
    @staticmethod
    def admin_or_instructor(current_user=Depends(get_current_user)):
        if current_user.role.name.lower() not in ["admin", "instructor"]:
            raise HTTPException(status_code=403, detail="Admin or Instructor privileges required")
        return current_user