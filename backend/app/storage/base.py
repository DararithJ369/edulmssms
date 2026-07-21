"""Storage provider abstraction."""
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional

from fastapi import UploadFile


class StorageProvider(ABC):
    """Abstract base class for file storage providers."""

    @abstractmethod
    def upload(self, file: UploadFile, folder: str = "", public: bool = True) -> str:
        """Upload a file and return a stored-path or URL."""
        raise NotImplementedError

    @abstractmethod
    def get_public_url(self, stored_path: str) -> str:
        """Return a public URL for the stored path."""
        raise NotImplementedError

    @abstractmethod
    def get_signed_url(self, stored_path: str, expires_in: int = 3600) -> str:
        """Return a signed/private URL for the stored path."""
        raise NotImplementedError

    @abstractmethod
    def get_local_path(self, stored_path: str) -> Optional[Path]:
        """Return a local filesystem path if available, else None."""
        raise NotImplementedError
