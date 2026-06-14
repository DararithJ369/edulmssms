from app.config.session import local_session
from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.student_profile import StudentProfile
from app.models.enrollment import Enrollment
from app.models.attendance import Attendance
from app.models.course import Course, Lesson

db = local_session()

try:
    print("--- Database Check ---")
    users_count = db.query(User).count()
    print(f"Total Users: {users_count}")
    
    students_count = db.query(User).filter(User.role_id == 3).count()
    print(f"Students count: {students_count}")
    
    enrollments_count = db.query(Enrollment).count()
    print(f"Enrollments count: {enrollments_count}")
    
    lessons_count = db.query(Lesson).count()
    print(f"Lessons count: {lessons_count}")
    
    attendance_count = db.query(Attendance).count()
    print(f"Attendance count: {attendance_count}")
    
    # Check student in screenshot
    student_id = "57bc7cab-91ea-4700-b28c-11cf176576c1"
    student_user = db.query(User).filter(User.id == student_id).first()
    if student_user:
        print(f"\nStudent {student_id} exists:")
        print(f"  Username: {student_user.username}")
        print(f"  Email: {student_user.email}")
        profile = student_user.profile
        if profile:
            print(f"  Full name: {profile.full_name}")
            print(f"  Class ID: {profile.class_id}")
            sp = profile.student_profile
            if sp:
                print(f"  Student Profile ID: {sp.id}")
                enrolls = db.query(Enrollment).filter(Enrollment.student_profile_id == sp.id).all()
                print(f"  Enrollments count for this student: {len(enrolls)}")
                for e in enrolls:
                    print(f"    - Course ID: {e.course_id}, Active: {e.is_active}")
            else:
                print("  No student_profile found!")
        else:
            print("  No profile found!")
    else:
        print(f"\nStudent {student_id} NOT found in database!")

finally:
    db.close()
