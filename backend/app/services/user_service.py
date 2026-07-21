from typing import Optional
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from app.models.user import User as DBUser
from app.models.role import Role
from app.schemas.user import UserCreate, UserUpdate, LoginRequest, UserResponse
from fastapi import HTTPException, UploadFile, status
from app.config.security import get_password_hash, verify_password
from app.utils.get_image import get_image

class UserService:
    
    @staticmethod
    def login(db: Session, login_request: LoginRequest) -> UserResponse:
        user = db.query(DBUser).filter(func.lower(DBUser.email) == func.lower(login_request.email)).first()
        
        if not user or not verify_password(login_request.password, user.hashed_password):  # type: ignore[arg-type]
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
        existing_user = db.query(DBUser).filter(func.lower(DBUser.email) == func.lower(user_in.email)).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        if not user_in.password:
            raise HTTPException(status_code=400, detail="Password is required")
        
        role = db.query(Role).filter(Role.id == user_in.role_id).first()
        if not role:
            raise HTTPException(status_code=400, detail="Invalid role_id")

        new_user = DBUser(
            email=user_in.email,
            username=user_in.username,
            hashed_password=get_password_hash(user_in.password),
            role_id=user_in.role_id, 
            is_active=True,
            is_superuser=False
        )
        
        if image:
            new_user.image = get_image(image)
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return UserResponse.model_validate(new_user)
    
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> UserResponse:
        user = db.query(DBUser).filter(DBUser.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserResponse.model_validate(user)
    
    
    @staticmethod
    def get_users(db: Session, page: int, limit: int, search: str = "", role_name: str = ""):
        query = db.query(DBUser)
        
        if role_name:
            query = query.join(Role).filter(func.lower(Role.name) == func.lower(role_name))
            
        if search:
            from app.models.user_profile import UserProfile
            query = query.outerjoin(UserProfile, DBUser.id == UserProfile.user_id).filter(
                (DBUser.username.ilike(f"%{search}%")) |
                (DBUser.email.ilike(f"%{search}%")) |
                (UserProfile.full_name.ilike(f"%{search}%"))
            )
            
        total = query.with_entities(func.count(DBUser.id)).scalar()
        
        users = (
            query.order_by(DBUser.created_at.desc())
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
    def get_users_by_role(
        db: Session,
        role_name: str,
        page: int,
        limit: int,
        search: str = "",
        class_id: Optional[int] = None,
        grade_id: Optional[int] = None,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None,
        department: Optional[str] = None,
        relationship: Optional[str] = None
    ):
        query = (
            db.query(DBUser)
            .join(Role)
            .filter(func.lower(Role.name) == func.lower(role_name))
        )
        
        from app.models.user_profile import UserProfile
        from app.models.student_profile import StudentProfile

        query = query.outerjoin(UserProfile, DBUser.id == UserProfile.user_id)

        if role_name == "instructor":
            from app.models.instructor_profile import InstructorProfile
            query = query.outerjoin(InstructorProfile, UserProfile.id == InstructorProfile.profile_id)
            if department:
                query = query.filter(InstructorProfile.department == department)

        if role_name == "parent":
            from app.models.parent_profile import ParentProfile
            query = query.outerjoin(ParentProfile, UserProfile.id == ParentProfile.profile_id)
            if relationship:
                query = query.filter(ParentProfile.parent_relationship == relationship)
        
        if class_id is not None:
            query = query.filter(UserProfile.class_id == class_id)
            
        if grade_id is not None:
            query = query.outerjoin(StudentProfile, UserProfile.id == StudentProfile.profile_id).filter(
                (StudentProfile.grade_level_id == grade_id)
            )
            
        if search:
            query = query.filter(
                (DBUser.username.ilike(f"%{search}%")) |
                (DBUser.email.ilike(f"%{search}%")) |
                (UserProfile.full_name.ilike(f"%{search}%"))
            )
            
        total = query.with_entities(func.count(DBUser.id)).scalar()

        if sort_by == "name":
            if sort_order == "desc":
                query = query.order_by(func.coalesce(UserProfile.full_name, DBUser.username).desc())
            else:
                query = query.order_by(func.coalesce(UserProfile.full_name, DBUser.username).asc())
        elif sort_by == "grade":
            if grade_id is None:
                query = query.outerjoin(StudentProfile, UserProfile.id == StudentProfile.profile_id)
            if sort_order == "desc":
                query = query.order_by(StudentProfile.grade_level_id.desc())
            else:
                query = query.order_by(StudentProfile.grade_level_id.asc())
        else:
            query = query.order_by(DBUser.created_at.desc())
        
        users = (
            query.offset((page - 1) * limit)
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
        user = db.query(DBUser).filter(DBUser.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user_in.email:
            existing_user = db.query(DBUser).filter(func.lower(DBUser.email) == func.lower(user_in.email), DBUser.id != user_id).first()
            if existing_user:
                raise HTTPException(status_code=400, detail="Email already registered")
            user.email = user_in.email  # type: ignore[attr-defined]
        
        if user_in.username:
            user.username = user_in.username  # type: ignore[attr-defined]
        
        if user_in.password:
            user.hashed_password = get_password_hash(user_in.password)  # type: ignore[attr-defined]
        
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
        # 1. Fetch user safely using DBUser model
        user = db.query(DBUser).filter(DBUser.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # 2. Localized model imports to prevent circular references
        from app.models.user_profile import UserProfile
        from app.models.student_profile import StudentProfile
        from app.models.instructor_profile import InstructorProfile
        from app.models.parent_profile import ParentProfile
        from app.models.enrollment import Enrollment
        from app.models.subject import Subject
        from app.models.course import Course
        from app.models.attendance import Attendance
        from app.models.result import Result
        from app.models.submission import Submission
        from app.models.announcement import Announcement
        from app.models.exam import Exam
        from app.models.assignment import Assignment
        from app.models.quiz import Quiz, QuizQuestion, QuizOption
        from app.models.progress import StudentCourseProgress, StudentLessonProgress, StudentModuleProgress
        from app.models.certificate import StudentCertificate
        
        # Explicitly aliasing to resolve name collisions
        from app.models.class_ import Class as DBClass
        from app.models.lesson_material import LessonMaterial
        from app.models.lesson_view import StudentLessonView
        from app.models.ai_tutor import AIConversation
        from app.models.notification import Notification
        from app.models.schedule_slot import ScheduleSlot
        from app.models.class_session import ClassSession
        from app.models.lesson_note import StudentLessonNote

        # 3. Structural Dependency Guard
        active_supervisions = db.query(DBClass).filter(DBClass.supervisor_id == user_id).count()
        if active_supervisions > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete user. This user is assigned as the supervisor for {active_supervisions} active class(es). Please reassign class supervisors first."
            )

        try:
            # 4. Atomic Profile Hierarchy Teardown (No object-relationship evaluation loops)
            profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
            if profile:
                sp = db.query(StudentProfile).filter(StudentProfile.profile_id == profile.id).first()
                if sp:
                    # Clear intermediate enrollments and M2M associations via direct query execution
                    db.query(Enrollment).filter(Enrollment.student_profile_id == sp.id).delete(synchronize_session=False)
                    sp.parents.clear()
                    db.delete(sp)
                
                db.query(InstructorProfile).filter(InstructorProfile.profile_id == profile.id).delete(synchronize_session=False)
                db.query(ParentProfile).filter(ParentProfile.profile_id == profile.id).delete(synchronize_session=False)
                db.delete(profile)

            # 5. Cascaded Cleanups (Direct SQL execution blocks)
            db.query(StudentCourseProgress).filter(StudentCourseProgress.student_id == user_id).delete(synchronize_session=False)
            db.query(StudentLessonProgress).filter(StudentLessonProgress.student_id == user_id).delete(synchronize_session=False)
            db.query(StudentModuleProgress).filter(StudentModuleProgress.student_id == user_id).delete(synchronize_session=False)
            db.query(StudentCertificate).filter(StudentCertificate.student_id == user_id).delete(synchronize_session=False)
            db.query(Subject).filter(Subject.instructor_id == user_id).delete(synchronize_session=False)
            
            db.query(AIConversation).filter(AIConversation.student_id == user_id).delete(synchronize_session=False)
            db.query(StudentLessonView).filter(StudentLessonView.student_id == user_id).delete(synchronize_session=False)
            db.query(Notification).filter(Notification.user_id == user_id).delete(synchronize_session=False)
            db.query(StudentLessonNote).filter(StudentLessonNote.student_id == user_id).delete(synchronize_session=False)
            
            # Fetch course IDs first to clear related cross-references cleanly
            course_ids = [c.id for c in db.query(Course).filter(Course.instructor_id == user_id).all()]
            if course_ids:
                db.query(Enrollment).filter(Enrollment.course_id.in_(course_ids)).delete(synchronize_session=False)
                db.query(Course).filter(Course.id.in_(course_ids)).delete(synchronize_session=False)

            # Clean up Attendance and Results records using precise boolean OR constraints
            db.query(Attendance).filter(or_(Attendance.student_id == user_id, Attendance.recorded_by == user_id)).delete(synchronize_session=False)
            db.query(Result).filter(or_(Result.student_id == user_id, Result.graded_by == user_id)).delete(synchronize_session=False)
            
            db.query(Submission).filter(Submission.student_id == user_id).delete(synchronize_session=False)
            db.query(Announcement).filter(Announcement.sender_id == user_id).delete(synchronize_session=False)
            db.query(Exam).filter(Exam.created_by == user_id).delete(synchronize_session=False)
            db.query(Assignment).filter(Assignment.teacher_id == user_id).delete(synchronize_session=False)

            # Handle Quiz structures dynamically via structural IDs
            quiz_ids = [q.id for q in db.query(Quiz).filter(Quiz.instructor_id == user_id).all()]
            if quiz_ids:
                question_ids = [qn.id for qn in db.query(QuizQuestion).filter(QuizQuestion.quiz_id.in_(quiz_ids)).all()]
                if question_ids:
                    db.query(QuizOption).filter(QuizOption.question_id.in_(question_ids)).delete(synchronize_session=False)
                    db.query(QuizQuestion).filter(QuizQuestion.id.in_(question_ids)).delete(synchronize_session=False)
                db.query(Quiz).filter(Quiz.id.in_(quiz_ids)).delete(synchronize_session=False)

            # 6. Historic and Auditable data transformations (Safe Nullification rules)
            db.query(LessonMaterial).filter(LessonMaterial.uploaded_by == user_id).update({LessonMaterial.uploaded_by: None}, synchronize_session=False)
            db.query(ScheduleSlot).filter(ScheduleSlot.teacher_id == user_id).update({ScheduleSlot.teacher_id: None}, synchronize_session=False)
            db.query(ClassSession).filter(ClassSession.teacher_id == user_id).update({ClassSession.teacher_id: None}, synchronize_session=False)

            # 7. Execute targeted core system user entry erasure
            db.delete(user)
            db.commit()
            return {"detail": "User deleted successfully"}
            
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Database error during deletion: {str(e)}")