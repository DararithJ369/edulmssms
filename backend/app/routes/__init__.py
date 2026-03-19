from .login import loggin_router
from .users import user_router
from .classes import class_router
from .subjects import subject_router
from .courses import course_router
from .lessons import lesson_router
from .assignments import assignment_router
from .quizzes import quiz_router
from .exams import exam_router
from .results import result_router
from .enrollments import enrollment_router
from .attendance import attendance_router
from .grades import grade_router
from .submissions import submission_router
from .grade_level import grade_level_router
from .academic_year import academic_year_router

all_routers = [
    loggin_router,
    user_router,
    class_router,
    subject_router,
    course_router,
    lesson_router,
    assignment_router,
    quiz_router,
    exam_router,
    result_router,
    enrollment_router,
    attendance_router,
    grade_router,
    submission_router,
    grade_level_router,
    academic_year_router,
    
]