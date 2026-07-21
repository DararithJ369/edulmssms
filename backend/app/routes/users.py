from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.user_service import UserService
from app.schemas.user import User, UserCreate, UserUpdate, UserResponse, PhoneUpdateRequest, PasswordChangeRequest
from app.services.audit_log_service import AuditLogService

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


@user_router.put("/me/phone", response_model=dict)
def update_my_phone(
    payload: PhoneUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard.get_current_user)
):
    # Enforce ownership check: Authenticated user updating their own phone number only
    # Phone number validation
    new_phone = payload.new_phone.strip()
    if not new_phone:
        raise HTTPException(status_code=400, detail="New phone number cannot be empty")
    
    # Check phone format (digits, plus sign, space, dash, parenthesis, length 5 to 20)
    import re
    if not re.match(r"^\+?[0-9\s\-()]{5,20}$", new_phone):
        raise HTTPException(status_code=400, detail="Invalid phone number format")

    # Check duplicates
    from app.models.user_profile import UserProfile
    existing = db.query(UserProfile).filter(
        UserProfile.phone == new_phone,
        UserProfile.user_id != current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number is already in use by another account")

    from app.models.user import User as DBUser
    db_user = db.query(DBUser).filter(DBUser.id == current_user.id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    old_phone = db_user.profile.phone if db_user.profile else None

    # Update profile
    if not db_user.profile:
        profile = UserProfile(user_id=db_user.id, phone=new_phone)
        db.add(profile)
    else:
        db_user.profile.phone = new_phone
    
    db.commit()

    # Log audit event
    AuditLogService.create_log(
        db=db,
        user_id=str(current_user.id),
        action="PHONE_UPDATE",
        message=f"Phone number updated from {old_phone or 'None'} to {new_phone}.",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )

    return {"detail": "Phone number updated successfully", "phone": new_phone}


@user_router.put("/me/password", response_model=dict)
def change_my_password(
    payload: PasswordChangeRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard.get_current_user)
):
    from app.models.user import User as DBUser
    db_user = db.query(DBUser).filter(DBUser.id == current_user.id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify current password
    from app.config.security import verify_password, get_password_hash
    if not verify_password(payload.current_password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    # Password confirmation validation
    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="New password and confirmation password do not match")

    # Prevent password reuse
    if verify_password(payload.new_password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="New password cannot be the same as your current password")

    # Password strength validation
    new_password = payload.new_password
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters long")
    if not any(char.isdigit() for char in new_password):
        raise HTTPException(status_code=400, detail="New password must contain at least one digit")
    if not any(char.isalpha() for char in new_password):
        raise HTTPException(status_code=400, detail="New password must contain at least one letter")

    # Update password
    db_user.hashed_password = get_password_hash(new_password)
    db.commit()

    # Log audit event
    AuditLogService.create_log(
        db=db,
        user_id=str(current_user.id),
        action="PASSWORD_CHANGE",
        message="Password changed successfully.",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )

    return {"detail": "Password changed successfully"}



@user_router.get("/students", response_model=dict)
def get_students(
    db: Session = Depends(get_db),
    page: int = 1,
    limit: int = 10,
    search: str = "",
    class_id: Optional[int] = None,
    grade_id: Optional[int] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = None
):
    """Get all users with student role - Updated with filtering & sorting"""
    return UserService.get_users_by_role(
        db,
        role_name="student",
        page=page,
        limit=limit,
        search=search,
        class_id=class_id,
        grade_id=grade_id,
        sort_by=sort_by,
        sort_order=sort_order
    )


@user_router.get("/instructors", response_model=dict)
def get_instructors(
    db: Session = Depends(get_db),
    page: int = 1,
    limit: int = 10,
    search: str = "",
    department: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = None
):
    """Get all users with instructor role - with filtering & sorting"""
    return UserService.get_users_by_role(
        db,
        role_name="instructor",
        page=page,
        limit=limit,
        search=search,
        department=department,
        sort_by=sort_by,
        sort_order=sort_order
    )


@user_router.get("/parents", response_model=dict)
def get_parents(
    db: Session = Depends(get_db),
    page: int = 1,
    limit: int = 10,
    search: str = "",
    relationship: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = None
):
    """Get all users with parent role - with filtering & sorting"""   
    return UserService.get_users_by_role(
        db,
        role_name="parent",
        page=page,
        limit=limit,
        search=search,
        relationship=relationship,
        sort_by=sort_by,
        sort_order=sort_order
    )


@user_router.get("/admins", response_model=dict, dependencies=[Depends(PermissionGuard.admin_only)])
def get_admin(db: Session = Depends(get_db), page: int = 1, limit: int = 10):
    """Get all users with admin role"""
    return UserService.get_users_by_role(db, role_name="admin", page=page, limit=limit)


@user_router.post("", response_model=UserResponse)
def create_user(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role_id: int = Form(...),
    image: Optional[UploadFile] = File(None), 
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard.get_current_user)
):
    if current_user.role.name.lower() != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    user = UserService.create_user(db, UserCreate(
        username=username,
        email=email,
        password=password,
        role_id=role_id
    ), image)

    AuditLogService.create_log(
        db=db,
        user_id=str(current_user.id),
        action="USER_CREATE",
        message=f"Created user {user.username} ({user.email}) with role ID {user.role_id}."
    )
    return user


@user_router.get("", response_model=dict)
def get_all_users(
    db: Session = Depends(get_db),
    page: int = 1,
    limit: int = 10,
    search: str = "",
    role: str = "",
    current_user = Depends(PermissionGuard.get_current_user)
):
    role_name = current_user.role.name.lower() if current_user.role else ""
    if role_name not in ["admin", "instructor", "teacher"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    return UserService.get_users(db, page, limit, search=search, role_name=role)


@user_router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard.get_current_user)
):
    if current_user.role.name.lower() != "admin" and str(current_user.id) != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
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
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard.get_current_user)
):
    if current_user.role.name.lower() != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    try: 
        user_data = UserUpdate(
            username=username,
            email=email,
            password=password,
            role_id=role_id
        )
        updated = UserService.update_user(db, user_id, user_data, image)
        AuditLogService.create_log(
            db=db,
            user_id=str(current_user.id),
            action="USER_UPDATE",
            message=f"Updated user {updated.username} ({updated.email}) details."
        )
        return updated
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    
@user_router.delete("/{user_id}")
def delete_user(
    user_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard.get_current_user)
):
    if current_user.role.name.lower() != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        user = db.query(User).filter(User.id == user_id).first()
        username = user.username if user else "Unknown"
        email = user.email if user else "Unknown"
        UserService.delete_user(db, user_id)
        AuditLogService.create_log(
            db=db,
            user_id=str(current_user.id),
            action="USER_DELETE",
            message=f"Deleted user {username} ({email})."
        )
        return {"detail": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))