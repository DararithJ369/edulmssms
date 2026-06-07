from fastapi import APIRouter, Depends, HTTPException, Header, BackgroundTasks
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from pathlib import Path
from pydantic import BaseModel

from app.config.session import get_db
from app.config.security import get_current_user
from app.models.user import User
from app.models.course import Lesson
from app.models.video_progress import StudentVideoProgress
from app.models.lesson_note import StudentLessonNote
from app.models.progress import StudentLessonProgress
from app.routes.progress import recalculate_course_progress

router = APIRouter(prefix="/lessons", tags=["Video Learning"])

class VideoProgressPayload(BaseModel):
    current_time: float
    duration: float

class LessonNotePayload(BaseModel):
    timestamp: float
    content: str


def range_stream(file_path: str, start: int, end: int, chunk_size: int = 1024 * 1024):
    """Yield chunks of a file for HTTP range requests."""
    with open(file_path, "rb") as f:
        f.seek(start)
        bytes_to_read = end - start + 1
        while bytes_to_read > 0:
            chunk = f.read(min(chunk_size, bytes_to_read))
            if not chunk:
                break
            bytes_to_read -= len(chunk)
            yield chunk


@router.get("/{lesson_id}/video/stream")
def stream_lesson_video(
    lesson_id: int,
    range_header: Optional[str] = Header(None, alias="Range"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Secure byte-range video streaming endpoint for enrolled students.
    """
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    file_url = lesson.material_file
    if not file_url:
        raise HTTPException(status_code=404, detail="No video file uploaded for this lesson")

    # Resolve URL path on disk
    if file_url.startswith("http"):
        parts = file_url.split("/uploads/")
        relative_path = "uploads/" + parts[-1] if len(parts) > 1 else file_url
    else:
        relative_path = file_url

    file_path = Path("/Users/mac/Documents/School ITC/Year3/wdim/lms-fastapi/backend") / relative_path
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found on disk")

    file_size = file_path.stat().st_size

    if range_header:
        try:
            range_type, range_vals = range_header.split("=")
            start_str, end_str = range_vals.split("-")
            start = int(start_str) if start_str else 0
            end = int(end_str) if end_str else file_size - 1
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid range header formatting")

        if start >= file_size or end >= file_size:
            raise HTTPException(status_code=416, detail="Requested range not satisfiable")

        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(end - start + 1),
            "Content-Type": "video/mp4",
        }
        return StreamingResponse(
            range_stream(str(file_path), start, end),
            status_code=206,
            headers=headers
        )
    else:
        headers = {
            "Accept-Ranges": "bytes",
            "Content-Length": str(file_size),
            "Content-Type": "video/mp4",
        }
        return FileResponse(str(file_path), headers=headers)


@router.get("/{lesson_id}/video/progress")
def get_video_progress(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch the student's current video progress for resuming playback.
    """
    prog = db.query(StudentVideoProgress).filter(
        StudentVideoProgress.student_id == current_user.id,
        StudentVideoProgress.lesson_id == lesson_id
    ).first()
    
    if not prog:
        return {"current_time": 0.0, "duration": 0.0, "completed": False}
    
    return {
        "current_time": prog.current_time,
        "duration": prog.duration,
        "completed": prog.completed
    }


@router.post("/{lesson_id}/video/progress")
def save_video_progress(
    lesson_id: int,
    payload: VideoProgressPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Save the student's current video playback timestamp. If >90% is watched,
    it automatically marks the lesson complete.
    """
    completed = False
    if payload.duration > 0 and (payload.current_time / payload.duration) >= 0.9:
        completed = True

    prog = db.query(StudentVideoProgress).filter(
        StudentVideoProgress.student_id == current_user.id,
        StudentVideoProgress.lesson_id == lesson_id
    ).first()

    if not prog:
        prog = StudentVideoProgress(
            student_id=current_user.id,
            lesson_id=lesson_id,
            current_time=payload.current_time,
            duration=payload.duration,
            completed=completed
        )
        db.add(prog)
    else:
        prog.current_time = payload.current_time
        prog.duration = payload.duration
        if completed:
            prog.completed = True

    # Auto toggle lesson progress to completed if >90% watched
    if completed:
        lesson_prog = db.query(StudentLessonProgress).filter(
            StudentLessonProgress.student_id == current_user.id,
            StudentLessonProgress.lesson_id == lesson_id
        ).first()

        if not lesson_prog or not lesson_prog.completed:
            if not lesson_prog:
                lesson_prog = StudentLessonProgress(student_id=current_user.id, lesson_id=lesson_id)
                db.add(lesson_prog)
            
            lesson_prog.completed = True
            lesson_prog.completed_at = func.now()
            db.commit()

            # Record streak activity
            try:
                from app.services.streak_service import StreakService
                StreakService.record_activity(db, current_user.id)
            except Exception:
                pass

            # Recalculate course progress
            lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
            if lesson and lesson.module:
                recalculate_course_progress(db, current_user.id, lesson.module.course_id)

    db.commit()
    db.refresh(prog)
    return {"message": "Video progress saved", "data": prog}


@router.get("/{lesson_id}/video/notes")
def get_video_notes(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve all watch notes written by the student for this lesson.
    """
    notes = db.query(StudentLessonNote).filter(
        StudentLessonNote.student_id == current_user.id,
        StudentLessonNote.lesson_id == lesson_id
    ).order_by(StudentLessonNote.timestamp.asc()).all()
    return notes


@router.post("/{lesson_id}/video/notes")
def add_video_note(
    lesson_id: int,
    payload: LessonNotePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a new timestamped watch note for the video lecture.
    """
    note = StudentLessonNote(
        student_id=current_user.id,
        lesson_id=lesson_id,
        timestamp=payload.timestamp,
        content=payload.content
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return {"message": "Watch note added successfully", "data": note}


@router.post("/{lesson_id}/view")
def record_lesson_view(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Record that a student has viewed a lesson.
    """
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    from app.models.lesson_view import StudentLessonView
    
    view = db.query(StudentLessonView).filter(
        StudentLessonView.student_id == current_user.id,
        StudentLessonView.lesson_id == lesson_id
    ).first()
    
    if not view:
        view = StudentLessonView(student_id=current_user.id, lesson_id=lesson_id)
        db.add(view)
    else:
        view.viewed_at = func.now()
        
    db.commit()
    return {"message": "Lesson view recorded"}
