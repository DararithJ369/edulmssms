"""Azure Blob storage provider (production stub)."""
from pathlib import Path
from typing import Optional

from fastapi import UploadFile

from app.storage.base import StorageProvider


class AzureBlobStorageProvider(StorageProvider):
    """Stores files in Azure Blob Storage (placeholder implementation).

    To enable, install azure-storage-blob and set AZURE_STORAGE_CONNECTION_STRING
    and AZURE_CONTAINER_NAME.
    """

    def __init__(self) -> None:
        raise NotImplementedError(
            "Azure Blob Storage provider is not yet implemented. "
            "Set STORAGE_PROVIDER to 's3' or 'cloudinary' instead."
        )

    def upload(self, file: UploadFile, folder: str = "", public: bool = True) -> str:
        raise NotImplementedError

    def get_public_url(self, stored_path: str) -> str:
        raise NotImplementedError

    def get_signed_url(self, stored_path: str, expires_in: int = 3600) -> str:
        raise NotImplementedError

    def get_local_path(self, stored_path: str) -> Optional[Path]:
        return None
