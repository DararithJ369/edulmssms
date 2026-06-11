import os
import secrets
from typing import List, Optional, Union
from pydantic_settings import BaseSettings
from pydantic import Field, EmailStr, AnyHttpUrl, validator


class Settings(BaseSettings):

    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Learning Management System"

    # Security
    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    JWT_ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = []

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]):
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        return v

    # PostgreSQL
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int
    POSTGRESQL_URI: str = None

    # Email
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = 587
    SMTP_HOST: Optional[str] = "smtp.gmail.com"
    SMTP_USER: Optional[EmailStr] = None
    SMTP_PASSWORD: Optional[str] = None

    EMAILS_FROM_EMAIL: Optional[EmailStr] = "info@example.com"
    EMAILS_FROM_NAME: Optional[str] = "LMS Support"

    # Admin
    FIRST_SUPERUSER_EMAIL: EmailStr = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str

    # File Upload
    UPLOAD_FOLDER: str = os.path.join(os.getcwd(), "uploads")
    MAX_FILE_SIZE: int = 50 * 1024 * 1024

    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: Optional[str] = None

    # Storage settings
    STORAGE_PROVIDER: str = "local" # local, s3, r2, minio
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    AWS_BUCKET_NAME: Optional[str] = None
    AWS_ENDPOINT_URL: Optional[str] = None
    CLOUDFRONT_URL: Optional[str] = None

    class Config:
        env_file = ".env"


settings = Settings()