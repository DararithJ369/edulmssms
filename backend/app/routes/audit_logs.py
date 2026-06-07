from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.audit_log_service import AuditLogService

audit_log_router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"],
    dependencies=[Depends(PermissionGuard.admin_only)]
)


@audit_log_router.get("")
def get_audit_logs(
    db: Session = Depends(get_db),
    page: int = 1,
    limit: int = 10,
    search: str = ""
):
    return AuditLogService.get_audit_logs(db, page, limit, search)
