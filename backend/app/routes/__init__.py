from .auth import auth_router
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
from .grade_level import grade_level_router, grade_level_alias_router
from .academic_year import academic_year_router
from .dashboard import dashboard_router
from .finance import finance_router
from .roles import role_router
from .permissions import permission_router
from .role_permissions import role_permissions_router
from .courses_management import router as courses_management_router
from .announcements import announcement_router
from .progress import progress_router

all_routers = [
    auth_router,
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
    grade_level_alias_router,
    academic_year_router,
    courses_management_router,
    finance_router,
    role_router,
    permission_router,
    role_permissions_router,
    announcement_router,
    progress_router,
]