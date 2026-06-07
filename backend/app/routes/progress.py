import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.config.session import get_db
from app.config.security import get_current_user
from app.models.user import User
from app.models.course import Course, Module, Lesson
from app.models.progress import StudentCourseProgress, StudentLessonProgress, StudentModuleProgress
from app.schemas.progress import ToggleProgressRequest, CourseProgressAggregate, StudentCourseProgressResponse
from app.models.streak import StudentStreak
from app.services.streak_service import StreakService

logger = logging.getLogger(__name__)

progress_router = APIRouter(prefix="/progress", tags=["Learning Progress"])


def recalculate_course_progress(db: Session, student_id: str, course_id: int):
    # Fetch all modules for the course
    modules = db.query(Module).filter(Module.course_id == course_id).all()
    module_ids = [m.id for m in modules]

    if not module_ids:
        # If the course has no modules, progress is 100%
        prog = db.query(StudentCourseProgress).filter(
            StudentCourseProgress.student_id == student_id,
            StudentCourseProgress.course_id == course_id
        ).first()
        if not prog:
            prog = StudentCourseProgress(student_id=student_id, course_id=course_id)
            db.add(prog)
        prog.progress_percentage = 100.0
        prog.completed_lessons = 0
        prog.completed_modules = 0
        prog.completed_at = func.now()
        db.commit()
        return

    # Fetch all lessons for these modules
    lessons = db.query(Lesson).filter(Lesson.module_id.in_(module_ids)).all()
    lesson_ids = [l.id for l in lessons]

    total_lessons = len(lesson_ids)
    if total_lessons == 0:
        completed_lessons = 0
        percentage = 100.0
    else:
        # Count completed lessons
        completed_lessons = db.query(StudentLessonProgress).filter(
            StudentLessonProgress.student_id == student_id,
            StudentLessonProgress.lesson_id.in_(lesson_ids),
            StudentLessonProgress.completed == True
        ).count()
        percentage = round((completed_lessons / total_lessons) * 100.0, 1)

    # Sync module progress
    completed_modules_count = 0
    for m in modules:
        m_lessons = [l for l in lessons if l.module_id == m.id]
        if not m_lessons:
            # Empty module is considered completed if course has lessons completed
            is_module_completed = True
        else:
            m_lesson_ids = [l.id for l in m_lessons]
            m_completed_count = db.query(StudentLessonProgress).filter(
                StudentLessonProgress.student_id == student_id,
                StudentLessonProgress.lesson_id.in_(m_lesson_ids),
                StudentLessonProgress.completed == True
            ).count()
            is_module_completed = (m_completed_count == len(m_lessons))

        mod_progress = db.query(StudentModuleProgress).filter(
            StudentModuleProgress.student_id == student_id,
            StudentModuleProgress.module_id == m.id
        ).first()

        if not mod_progress:
            mod_progress = StudentModuleProgress(student_id=student_id, module_id=m.id)
            db.add(mod_progress)
        
        mod_progress.completed = is_module_completed
        if is_module_completed:
            completed_modules_count += 1
            mod_progress.completed_at = datetime.now()

    # Save course progress
    course_progress = db.query(StudentCourseProgress).filter(
        StudentCourseProgress.student_id == student_id,
        StudentCourseProgress.course_id == course_id
    ).first()

    if not course_progress:
        course_progress = StudentCourseProgress(student_id=student_id, course_id=course_id)
        db.add(course_progress)

    course_progress.progress_percentage = percentage
    course_progress.completed_lessons = completed_lessons
    course_progress.completed_modules = completed_modules_count
    
    if percentage >= 100.0:
        course_progress.completed_at = datetime.now()
    else:
        course_progress.completed_at = None

    db.commit()


@progress_router.get("/course/{course_id}", response_model=CourseProgressAggregate)
def get_course_progress(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student_id = current_user.id

    # Get modules list for matching
    modules = db.query(Module).filter(Module.course_id == course_id).all()
    module_ids = [m.id for m in modules]

    # Get lessons list for matching
    lessons = db.query(Lesson).filter(Lesson.module_id.in_(module_ids)).all() if module_ids else []
    lesson_ids = [l.id for l in lessons]

    # Completed lists
    completed_lessons = db.query(StudentLessonProgress).filter(
        StudentLessonProgress.student_id == student_id,
        StudentLessonProgress.lesson_id.in_(lesson_ids) if lesson_ids else False,
        StudentLessonProgress.completed == True
    ).all()
    completed_lesson_ids = [p.lesson_id for p in completed_lessons]

    completed_modules = db.query(StudentModuleProgress).filter(
        StudentModuleProgress.student_id == student_id,
        StudentModuleProgress.module_id.in_(module_ids) if module_ids else False,
        StudentModuleProgress.completed == True
    ).all()
    completed_module_ids = [p.module_id for p in completed_modules]

    # Course Progress record
    course_progress = db.query(StudentCourseProgress).filter(
        StudentCourseProgress.student_id == student_id,
        StudentCourseProgress.course_id == course_id
    ).first()

    progress_percentage = course_progress.progress_percentage if course_progress else 0.0

    return CourseProgressAggregate(
        course_id=course_id,
        progress_percentage=progress_percentage,
        completed_lessons_count=len(completed_lesson_ids),
        total_lessons_count=len(lesson_ids),
        completed_modules_count=len(completed_module_ids),
        total_modules_count=len(module_ids),
        completed_lesson_ids=completed_lesson_ids,
        completed_module_ids=completed_module_ids
    )


@progress_router.post("/lesson/{lesson_id}", response_model=CourseProgressAggregate)
def toggle_lesson_progress(
    lesson_id: int,
    request: ToggleProgressRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student_id = current_user.id

    # Fetch lesson to find module & course association
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    module = db.query(Module).filter(Module.id == lesson.module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found for this lesson")

    # Toggle lesson completion
    prog = db.query(StudentLessonProgress).filter(
        StudentLessonProgress.student_id == student_id,
        StudentLessonProgress.lesson_id == lesson_id
    ).first()

    if not prog:
        prog = StudentLessonProgress(student_id=student_id, lesson_id=lesson_id)
        db.add(prog)
    
    prog.completed = request.completed
    prog.completed_at = datetime.now()
    db.commit()

    if request.completed:
        try:
            StreakService.record_activity(db, student_id)
        except Exception as e:
            logger.warning("Failed to record streak activity for lesson completion: %s", e)

    # Recalculate
    recalculate_course_progress(db, student_id, module.course_id)

    # Return refreshed status
    return get_course_progress(module.course_id, db, current_user)


@progress_router.post("/module/{module_id}", response_model=CourseProgressAggregate)
def toggle_module_progress(
    module_id: int,
    request: ToggleProgressRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student_id = current_user.id

    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    # Toggle module completion
    mod_prog = db.query(StudentModuleProgress).filter(
        StudentModuleProgress.student_id == student_id,
        StudentModuleProgress.module_id == module_id
    ).first()

    if not mod_prog:
        mod_prog = StudentModuleProgress(student_id=student_id, module_id=module_id)
        db.add(mod_prog)

    mod_prog.completed = request.completed
    mod_prog.completed_at = datetime.now()

    # If marking a module completed, automatically mark all nested lessons completed!
    # If marking incomplete, mark all nested lessons incomplete!
    lessons = db.query(Lesson).filter(Lesson.module_id == module_id).all()
    for l in lessons:
        prog = db.query(StudentLessonProgress).filter(
            StudentLessonProgress.student_id == student_id,
            StudentLessonProgress.lesson_id == l.id
        ).first()

        if not prog:
            prog = StudentLessonProgress(student_id=student_id, lesson_id=l.id)
            db.add(prog)
        prog.completed = request.completed
        prog.completed_at = datetime.now()

    db.commit()

    if request.completed:
        try:
            StreakService.record_activity(db, student_id)
        except Exception as e:
            logger.warning("Failed to record streak activity for module completion: %s", e)

    # Recalculate
    recalculate_course_progress(db, student_id, module.course_id)

    # Return refreshed status
    return get_course_progress(module.course_id, db, current_user)


@progress_router.get("/streak")
def get_student_streak(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    streak = db.query(StudentStreak).filter(StudentStreak.student_id == current_user.id).first()
    if not streak:
        return {
            "student_id": current_user.id,
            "current_streak": 0,
            "longest_streak": 0,
            "last_activity_date": None
        }
    return {
        "student_id": streak.student_id,
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "last_activity_date": streak.last_activity_date.isoformat() if streak.last_activity_date else None
    }


@progress_router.get("/resume-learning")
def get_resume_learning(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the most recently viewed lesson that is not fully completed yet,
    or the last viewed lesson.
    """
    from app.models.lesson_view import StudentLessonView
    from app.models.video_progress import StudentVideoProgress
    from app.models.progress import StudentLessonProgress

    # Query last viewed lessons
    last_viewed = (
        db.query(StudentLessonView)
        .filter(StudentLessonView.student_id == current_user.id)
        .order_by(StudentLessonView.viewed_at.desc())
        .all()
    )

    if not last_viewed:
        return {}

    # Find the first one that is not marked completed in StudentLessonProgress
    target_view = None
    for view in last_viewed:
        is_completed = db.query(StudentLessonProgress).filter(
            StudentLessonProgress.student_id == current_user.id,
            StudentLessonProgress.lesson_id == view.lesson_id,
            StudentLessonProgress.completed == True
        ).first()
        if not is_completed:
            target_view = view
            break

    # Fallback to the absolute last viewed if all are completed
    if not target_view:
        target_view = last_viewed[0]

    lesson = target_view.lesson
    if not lesson:
        return {}

    # Get video progress details if any
    vp = db.query(StudentVideoProgress).filter(
        StudentVideoProgress.student_id == current_user.id,
        StudentVideoProgress.lesson_id == lesson.id
    ).first()

    course_id = lesson.module.course_id if lesson.module else None
    course_name = lesson.module.course.course_name if lesson.module and lesson.module.course else None

    # Get course progress percentage
    course_progress = 0.0
    if course_id:
        cp_rec = db.query(StudentCourseProgress).filter(
            StudentCourseProgress.student_id == current_user.id,
            StudentCourseProgress.course_id == course_id
        ).first()
        if cp_rec:
            course_progress = cp_rec.progress_percentage

    return {
        "lesson_id": lesson.id,
        "lesson_title": lesson.title,
        "course_id": course_id,
        "course_name": course_name,
        "course_progress": course_progress,
        "current_time": vp.current_time if vp else 0.0,
        "duration": vp.duration if vp else 0.0,
        "completed": vp.completed if vp else False
    }


@progress_router.get("/recently-viewed", response_model=List[dict])
def get_recently_viewed(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the list of the 3-5 most recently viewed lessons.
    """
    from app.models.lesson_view import StudentLessonView
    
    views = (
        db.query(StudentLessonView)
        .filter(StudentLessonView.student_id == current_user.id)
        .order_by(StudentLessonView.viewed_at.desc())
        .limit(5)
        .all()
    )

    result = []
    for view in views:
        lesson = view.lesson
        if lesson:
            course_id = lesson.module.course_id if lesson.module else None
            course_name = lesson.module.course.course_name if lesson.module and lesson.module.course else None
            result.append({
                "lesson_id": lesson.id,
                "lesson_title": lesson.title,
                "course_id": course_id,
                "course_name": course_name,
                "viewed_at": view.viewed_at.isoformat()
            })
    return result


@progress_router.get("/continue-learning", response_model=List[dict])
def get_continue_learning(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns courses that the student is currently enrolled in with progress details.
    """
    from app.models.enrollment import Enrollment
    from app.models.user_profile import UserProfile
    
    # Get student profile first
    up = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not up or not up.student_profile:
        return []
        
    enrollments = db.query(Enrollment).filter(
        Enrollment.student_profile_id == up.student_profile.id,
        Enrollment.is_active == True
    ).all()
    
    result = []
    for e in enrollments:
        course = e.course
        if course:
            cp_rec = db.query(StudentCourseProgress).filter(
                StudentCourseProgress.student_id == current_user.id,
                StudentCourseProgress.course_id == course.id
            ).first()
            
            progress = cp_rec.progress_percentage if cp_rec else 0.0
            
            result.append({
                "course_id": course.id,
                "course_name": course.course_name,
                "description": course.description,
                "image": course.thumbnail,
                "progress_percentage": progress
            })
    return result


@progress_router.get("/recommended-courses", response_model=List[dict])
def get_recommended_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get course recommendations (courses the student is NOT enrolled in yet).
    """
    from app.models.enrollment import Enrollment
    from app.models.user_profile import UserProfile
    
    up = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    enrolled_course_ids = []
    if up and up.student_profile:
        enrolled_course_ids = [
            e.course_id for e in db.query(Enrollment).filter(
                Enrollment.student_profile_id == up.student_profile.id,
                Enrollment.is_active == True
            ).all()
        ]
        
    recommended = db.query(Course)
    if enrolled_course_ids:
        recommended = recommended.filter(Course.id.notin_(enrolled_course_ids))
        
    recommended = recommended.limit(4).all()
    
    return [
        {
            "id": c.id,
            "course_name": c.course_name,
            "description": c.description,
            "image": c.thumbnail,
            "teacher_name": c.teacher.profile.full_name if c.teacher and c.teacher.profile else (c.teacher.username if c.teacher else "Unknown Instructor")
        }
        for c in recommended
    ]
