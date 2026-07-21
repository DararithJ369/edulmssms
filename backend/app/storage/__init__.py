"""Storage provider factory."""
from app.config.config import settings
from app.storage.base import StorageProvider
from app.storage.cloudinary import CloudinaryStorageProvider
from app.storage.local import LocalStorageProvider
from app.storage.s3 import S3StorageProvider
from app.storage.azure import AzureBlobStorageProvider


class StorageProviderFactory:
    """Return the configured storage provider."""

    _instance: StorageProvider | None = None

    @classmethod
    def get_provider(cls) -> StorageProvider:
        if cls._instance is None:
            provider = settings.STORAGE_PROVIDER.lower()
            if provider == "local":
                cls._instance = LocalStorageProvider()
            elif provider == "s3":
                cls._instance = S3StorageProvider()
            elif provider == "azure":
                cls._instance = AzureBlobStorageProvider()
            else:
                # Default to Cloudinary for backward compatibility
                cls._instance = CloudinaryStorageProvider()
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


# Convenience alias
get_storage_provider = StorageProviderFactory.get_provider
