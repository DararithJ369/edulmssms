"""Cloudinary storage provider."""
from pathlib import Path
from typing import Optional

from fastapi import UploadFile

from app.storage.base import StorageProvider
from app.utils.cloudinary_upload import upload_to_cloudinary


class CloudinaryStorageProvider(StorageProvider):
    """Stores files in Cloudinary."""

    def upload(self, file: UploadFile, folder: str = "", public: bool = True) -> str:
        return upload_to_cloudinary(file, folder=folder or "", resource_type="auto")

    def get_public_url(self, stored_path: str) -> str:
        # Cloudinary uploads already return a full URL as stored_path
        return stored_path

    def get_signed_url(self, stored_path: str, expires_in: int = 3600) -> str:
        return stored_path

    def get_local_path(self, stored_path: str) -> Optional[Path]:
        return None
