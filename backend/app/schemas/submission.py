from pydantic import BaseModel, Field, field_serializer
from datetime import datetime
from typing import Optional


class SubmissionBase(BaseModel):
    submission_type: str = Field(..., description="Type: assignment, quiz, or exam")
    reference_id: int = Field(..., description="ID of assignment, quiz, or exam")
    student_id: str
    submission_file: Optional[str] = None
    submission_text: Optional[str] = None
    status: Optional[str] = "submitted"  # submitted, graded, late
    score: Optional[float] = None
    feedback: Optional[str] = None
    graded_at: Optional[datetime] = None


class SubmissionCreate(SubmissionBase):
    pass


class SubmissionUpdate(BaseModel):
    submission_file: Optional[str] = None
    submission_text: Optional[str] = None
    status: Optional[str] = None
    score: Optional[float] = None
    feedback: Optional[str] = None
    graded_at: Optional[datetime] = None
    
    
class SubmissionResponse(SubmissionBase):
    id: int
    submitted_at: datetime
    student_name: Optional[str] = None
    student_code: Optional[str] = None

    model_config = {"from_attributes": True}

    @field_serializer("submission_file")
    def serialize_submission_file(self, v: Optional[str]) -> Optional[str]:
        from app.services.storage import StorageService
        return StorageService.resolve_url(v)


class Submission(SubmissionBase):
    id: int
    submitted_at: datetime

    model_config = {"from_attributes": True}