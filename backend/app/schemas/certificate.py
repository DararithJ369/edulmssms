from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class CertificateBase(BaseModel):
    title: str
    description: Optional[str] = None
    
    
class CertificateCreate(CertificateBase):
    course_id: int
    
    
class CertificateUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    course_id: Optional[int] = None
    
    
class CertificateResponse(CertificateBase):
    id: int
    course_id: int
    template: Optional[str] = None # file path to certificate template
    created_at: datetime

    model_config = {"from_attributes": True}
    

class Certificate(CertificateBase):
    id: int
    course_id: int
    template: Optional[str] = None # file path to certificate template
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}
        
        
class StudentCertificateBase(BaseModel):
    certificate_id: int
    student_id: str
    course_id: int
    completation_date: datetime
    

class StudentCertificateResponse(StudentCertificateBase):
    id: int
    issue_date: datetime
    credential_id: str
    certificate_url: Optional[str] = None # URL to access the certificate
    status: str = "Available" # Available, Pending, Revoked
    
    model_config = {"from_attributes": True}
    
    
class StudentCertificate(StudentCertificateBase):
    id: int
    issue_date: datetime
    credential_id: str
    certificate_url: Optional[str] = None # URL to access the certificate
    status: str = "Available" # Available, Pending, Revoked
    
    model_config = {"from_attributes": True}
    