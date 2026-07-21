"""Local filesystem storage provider."""
import shutil
import uuid
from pathlib import Path
from typing import Optional

from fastapi import UploadFile

from app.storage.base import StorageProvider
from app.config.config import settings


class LocalStorageProvider(StorageProvider):
    """Stores files on the local filesystem."""

    def __init__(self, base_dir: Optional[str] = None) -> None:
        backend_root = Path(__file__).parent.parent.parent.parent
        self._base_dir = Path(base_dir) if base_dir else backend_root / settings.UPLOAD_FOLDER

    def upload(self, file: UploadFile, folder: str = "", public: bool = True) -> str:
        visibility = "public" if public else "private"
        target_dir = self._base_dir / visibility / (folder or "")
        target_dir.mkdir(parents=True, exist_ok=True)

        ext = Path(file.filename or "file").suffix
        filename = f"{uuid.uuid4()}{ext}"
        target_path = target_dir / filename

        with target_path.open("wb") as f:
            shutil.copyfileobj(file.file, f)

        return f"{visibility}/{folder}/{filename}" if folder else f"{visibility}/{filename}"

    def get_public_url(self, stored_path: str) -> str:
        return f"/api/v1/storage/public/{stored_path}"

    def get_signed_url(self, stored_path: str, expires_in: int = 3600) -> str:
        return f"{settings.API_V1_STR}/storage/private/{stored_path}"

    def get_local_path(self, stored_path: str) -> Optional[Path]:
        return self._base_dir / stored_path
