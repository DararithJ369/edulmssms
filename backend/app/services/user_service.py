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
    def get_users_by_role(db: Session, role_name: str, page: int, limit: int):
        total = (
            db.query(func.count(User.id))
            .join(Role)
            .filter(func.lower(Role.name) == func.lower(role_name))
            .scalar()
        )
        
        users = (
            db.query(User)
            .join(Role)
            .filter(func.lower(Role.name) == func.lower(role_name))
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

        # Import models inside to avoid circular dependencies
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

        try:
            # 1. Clean up student-specific enrollments & profiles
            profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
            if profile:
                sp = db.query(StudentProfile).filter(StudentProfile.profile_id == profile.id).first()
                if sp:
                    for e in list(sp.enrollments):
                        db.delete(e)
                    sp.parents.clear()
                    db.delete(sp)
                
                ip = db.query(InstructorProfile).filter(InstructorProfile.profile_id == profile.id).first()
                if ip:
                    db.delete(ip)
                
                pp = db.query(ParentProfile).filter(ParentProfile.profile_id == profile.id).first()
                if pp:
                    db.delete(pp)

                db.delete(profile)

            # Clean up student progress & certificates
            db.query(StudentCourseProgress).filter(StudentCourseProgress.student_id == user_id).delete(synchronize_session=False)
            db.query(StudentLessonProgress).filter(StudentLessonProgress.student_id == user_id).delete(synchronize_session=False)
            db.query(StudentModuleProgress).filter(StudentModuleProgress.student_id == user_id).delete(synchronize_session=False)
            db.query(StudentCertificate).filter(StudentCertificate.student_id == user_id).delete(synchronize_session=False)

            # 2. Clean up subjects
            db.query(Subject).filter(Subject.instructor_id == user_id).delete(synchronize_session=False)

            # 3. Clean up courses
            courses = db.query(Course).filter(Course.instructor_id == user_id).all()
            for course in courses:
                db.query(Enrollment).filter(Enrollment.course_id == course.id).delete(synchronize_session=False)
                db.delete(course)

            # 4. Clean up attendance
            db.query(Attendance).filter((Attendance.student_id == user_id) | (Attendance.recorded_by == user_id)).delete(synchronize_session=False)

            # 5. Clean up results
            db.query(Result).filter((Result.student_id == user_id) | (Result.graded_by == user_id)).delete(synchronize_session=False)

            # 6. Clean up submissions
            db.query(Submission).filter(Submission.student_id == user_id).delete(synchronize_session=False)

            # 7. Clean up announcements
            db.query(Announcement).filter(Announcement.sender_id == user_id).delete(synchronize_session=False)

            # 8. Clean up exams
            db.query(Exam).filter(Exam.created_by == user_id).delete(synchronize_session=False)

            # 9. Clean up assignments
            db.query(Assignment).filter(Assignment.teacher_id == user_id).delete(synchronize_session=False)

            # 10. Clean up quizzes & questions & options
            quizzes = db.query(Quiz).filter(Quiz.instructor_id == user_id).all()
            for q in quizzes:
                questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == q.id).all()
                for qn in questions:
                    db.query(QuizOption).filter(QuizOption.question_id == qn.id).delete(synchronize_session=False)
                    db.delete(qn)
                db.delete(q)

            # 11. Delete the user
            db.delete(user)
            db.commit()
            return {"detail": "User deleted successfully"}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Error deleting user: {str(e)}")