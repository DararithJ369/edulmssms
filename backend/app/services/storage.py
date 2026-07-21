from pathlib import Path
from typing import Optional

from fastapi import UploadFile

from app.storage import get_storage_provider
from app.config.config import settings


class StorageService:
    """Facade around the configured storage provider.

    The provider is selected via the STORAGE_PROVIDER environment variable.
    """

    @classmethod
    def _upload_file(cls, file: UploadFile, prefix: str, folder: str = "") -> str:
        public = prefix == "public"
        return get_storage_provider().upload(file, folder=folder, public=public)

    @classmethod
    def upload_public_file(cls, file: UploadFile, folder: str = "") -> str:
        """
        Saves file to public folder. Returns path key: 'public/{folder}/{uuid_filename}'
        """
        return cls._upload_file(file, "public", folder)

    @classmethod
    def upload_private_file(cls, file: UploadFile, folder: str = "") -> str:
        """
        Saves file to private folder. Returns path key: 'private/{folder}/{uuid_filename}'
        """
        return cls._upload_file(file, "private", folder)

    @classmethod
    def get_public_url(cls, stored_path: str) -> str:
        if settings.STORAGE_PROVIDER == "local":
            return f"/uploads/{stored_path}"
        return get_storage_provider().get_public_url(stored_path)

    @classmethod
    def generate_signed_url(cls, stored_path: str, expires_in: int = 3600) -> str:
        if settings.STORAGE_PROVIDER == "local":
            api_prefix = settings.API_V1_STR
            return f"{api_prefix}/storage/private/{stored_path}"
        return get_storage_provider().get_signed_url(stored_path, expires_in=expires_in)

    @classmethod
    def get_local_path(cls, stored_path: str) -> Path:
        provider = get_storage_provider()
        local_path = provider.get_local_path(stored_path)
        if local_path is None:
            backend_root = Path(__file__).parent.parent.parent.parent
            return backend_root / settings.UPLOAD_FOLDER / stored_path
        return local_path

    @classmethod
    def resolve_url(cls, stored_path: Optional[str]) -> Optional[str]:
        if not stored_path:
            return stored_path
        if stored_path.startswith(("http://", "https://")):
            return stored_path

        clean_path = stored_path
        if stored_path.startswith("/"):
            clean_path = stored_path[1:]

        if clean_path.startswith("public/"):
            return cls.get_public_url(clean_path)
        if clean_path.startswith("private/"):
            return cls.generate_signed_url(clean_path)

        return stored_path
