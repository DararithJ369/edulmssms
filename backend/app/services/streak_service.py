from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.streak import StudentStreak

class StreakService:
    @staticmethod
    def record_activity(db: Session, student_id: str) -> StudentStreak:
        """
        Record a learning activity for the student and update their streak.
        Qualifying activities include: lesson completions, quiz submissions,
        assignment submissions, and exam submissions.
        """
        if not student_id:
            return None

        today = datetime.now().date()
        yesterday = today - timedelta(days=1)

        # Retrieve or create streak
        streak = db.query(StudentStreak).filter(StudentStreak.student_id == student_id).first()
        if not streak:
            streak = StudentStreak(
                student_id=student_id,
                current_streak=1,
                longest_streak=1,
                last_activity_date=today
            )
            db.add(streak)
        else:
            if streak.last_activity_date is None:
                streak.current_streak = 1
                streak.last_activity_date = today
            elif streak.last_activity_date == today:
                # Already logged activity today, do not increment further
                pass
            elif streak.last_activity_date == yesterday:
                # Consecutive day activity, increment streak
                streak.current_streak += 1
                streak.last_activity_date = today
            else:
                # Streak broken, reset to 1
                streak.current_streak = 1
                streak.last_activity_date = today

            if streak.current_streak > streak.longest_streak:
                streak.longest_streak = streak.current_streak

        db.commit()
        db.refresh(streak)
        return streak
