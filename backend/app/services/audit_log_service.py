from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogResponse


class AuditLogService:

    @staticmethod
    def get_audit_logs(db: Session, page: int = 1, limit: int = 10, search: str = "") -> dict:
        query = db.query(AuditLog)
        
        if search:
            query = query.filter(
                (AuditLog.action.ilike(f"%{search}%")) |
                (AuditLog.message.ilike(f"%{search}%"))
            )
        
        total = query.with_entities(func.count(AuditLog.id)).scalar()
        
        items = (
            query.order_by(AuditLog.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        
        return {
            "data": [AuditLogResponse.model_validate(item) for item in items],
            "meta": {
                "page": page,
                "total": total,
                "limit": limit,
            }
        }

    @staticmethod
    def create_log(
        db: Session,
        user_id: Optional[str],
        action: str,
        message: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        log = AuditLog(
            user_id=user_id,
            action=action,
            message=message,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
