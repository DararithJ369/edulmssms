from sqlalchemy.orm import Session
from app.models.user_profile import UserProfile
from app.models.enrollment import Enrollment
from app.models.result import Result
from app.models.assignment import Assignment
from app.models.quiz import Quiz
from app.models.course import Course, Lesson, Module

def calculate_gpa(db: Session, student_id: str):
    # Find the student profile
    user_profile = db.query(UserProfile).filter(UserProfile.user_id == student_id).first()
    if not user_profile or not user_profile.student_profile:
        return {
            "gpa": 0.0,
            "total_credits": 0,
            "passed_subjects": 0,
            "failed_subjects": 0,
            "courses_gpa": []
        }
    
    student_profile_id = user_profile.student_profile.id

    # Fetch active enrollments
    enrollments = db.query(Enrollment).filter(
        Enrollment.student_profile_id == student_profile_id,
        Enrollment.is_active == True
    ).all()

    # Fetch all results for the student
    results = db.query(Result).filter(Result.student_id == student_id).all()

    courses_gpa = []
    total_gpa_points_credits = 0.0
    total_credits = 0
    passed_subjects = 0
    failed_subjects = 0

    # Map grades to points
    def get_points(grade_str):
        mapping = {
            "A": 4.0,
            "B+": 3.5,
            "B": 3.0,
            "C+": 2.5,
            "C": 2.0,
            "D": 1.0,
            "F": 0.0
        }
        return mapping.get(grade_str.upper(), 0.0)

    # Map percentage to grade
    def get_grade(percentage):
        if percentage >= 90:
            return "A"
        elif percentage >= 85:
            return "B+"
        elif percentage >= 80:
            return "B"
        elif percentage >= 70:
            return "C+"
        elif percentage >= 60:
            return "C"
        elif percentage >= 50:
            return "D"
        else:
            return "F"

    for e in enrollments:
        course = e.course
        if not course:
            continue
        
        course_id = course.id
        course_credits = course.subject.credits if course.subject else 3

        # Find results for this course
        course_results = []
        for r in results:
            if r.assignment_id and r.assignment and r.assignment.course_id == course_id:
                course_results.append(r)
            elif r.quiz_id and r.quiz and r.quiz.course_id == course_id:
                course_results.append(r)
            elif r.exam_id and r.exam and r.exam.lesson and r.exam.lesson.module and r.exam.lesson.module.course_id == course_id:
                course_results.append(r)
        
        if not course_results:
            # Course has no results yet, skip from GPA calculation
            continue

        # Calculate final percentage
        percentages = [r.percentage for r in course_results if r.percentage is not None]
        if not percentages:
            continue
        avg_percentage = sum(percentages) / len(percentages)
        
        # Letter Grade and Points
        grade = get_grade(avg_percentage)
        points = get_points(grade)

        if grade != "F":
            total_credits += course_credits
            passed_subjects += 1
        else:
            failed_subjects += 1

        total_gpa_points_credits += points * course_credits
        
        courses_gpa.append({
            "course_id": course_id,
            "course_name": course.course_name,
            "course_code": course.course_code,
            "academic_year": e.academic_year.name if e.academic_year else "N/A",
            "term": e.term.name if e.term else "Semester I",
            "credits": course_credits,
            "percentage": round(avg_percentage, 2),
            "grade": grade,
            "gpa_points": points
        })

    cumulative_credits_sum = sum(c["credits"] for c in courses_gpa)
    gpa = (total_gpa_points_credits / cumulative_credits_sum) if cumulative_credits_sum > 0 else 0.0

    return {
        "gpa": round(gpa, 2),
        "total_credits": total_credits,
        "passed_subjects": passed_subjects,
        "failed_subjects": failed_subjects,
        "courses_gpa": courses_gpa
    }
