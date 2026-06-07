import os
import shutil
import uuid
from typing import Optional
from fastapi import UploadFile, HTTPException, status
from pathlib import Path

# Enforce secure upload rules
ALLOWED_EXTENSIONS = {
    "pdf", "docx", "pptx", "xlsx", "zip",
    "png", "jpg", "jpeg", "gif", "mp4", "mkv", "mov"
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB in bytes


class FileManager:
    @staticmethod
    def get_upload_dir() -> Path:
        backend_root = Path(__file__).parent.parent.parent
        upload_dir = backend_root / "uploads"
        upload_dir.mkdir(parents=True, exist_ok=True)
        return upload_dir

    @staticmethod
    def validate_and_save(file: UploadFile) -> dict:
        filename = file.filename
        if not filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty filename provided"
            )

        # 1. Validate file extension
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File extension '.{ext}' is not supported. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # 2. Validate file size (chunked check to avoid memory bloat)
        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0)  # Reset pointer
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds the maximum limit of 10MB (provided: {round(file_size / (1024*1024), 2)}MB)"
            )

        # 3. Save file using StorageService
        from app.services.storage import StorageService
        try:
            stored_path = StorageService.upload_private_file(file, folder="submissions")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Could not save file to storage: {str(e)}"
            )

        # 4. Return structural metadata for DB storage
        secure_filename = stored_path.split("/")[-1]
        return {
            "filename": secure_filename,
            "original_filename": filename,
            "file_size": file_size,
            "upload_date": str(uuid.uuid4()),  # fallback unique identifier
            "url": stored_path
        }
