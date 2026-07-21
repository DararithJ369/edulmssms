"""S3-compatible storage provider (production stub)."""
from pathlib import Path
from typing import Optional

import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile

from app.storage.base import StorageProvider
from app.config.config import settings


class S3StorageProvider(StorageProvider):
    """Stores files in an S3-compatible bucket."""

    def __init__(self) -> None:
        self._client = None
        self._bucket = settings.AWS_BUCKET_NAME or "lms-bucket"
        self._init_client()

    def _init_client(self) -> None:
        kwargs = {}
        if settings.AWS_ACCESS_KEY_ID:
            kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
        if settings.AWS_SECRET_ACCESS_KEY:
            kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
        if settings.AWS_REGION:
            kwargs["region_name"] = settings.AWS_REGION
        if settings.AWS_ENDPOINT_URL:
            kwargs["endpoint_url"] = settings.AWS_ENDPOINT_URL
        self._client = boto3.client("s3", **kwargs)

    def upload(self, file: UploadFile, folder: str = "", public: bool = True) -> str:
        import uuid
        ext = Path(file.filename or "file").suffix
        key = f"{folder}/{uuid.uuid4()}{ext}" if folder else f"{uuid.uuid4()}{ext}"
        try:
            self._client.upload_fileobj(file.file, self._bucket, key)
        except ClientError as e:
            raise RuntimeError(f"S3 upload failed: {e}") from e
        return key

    def get_public_url(self, stored_path: str) -> str:
        if settings.CLOUDFRONT_URL:
            return f"{settings.CLOUDFRONT_URL.rstrip('/')}/{stored_path}"
        if settings.AWS_ENDPOINT_URL:
            return f"{settings.AWS_ENDPOINT_URL.rstrip('/')}/{self._bucket}/{stored_path}"
        region = settings.AWS_REGION or "us-east-1"
        return f"https://{self._bucket}.s3.{region}.amazonaws.com/{stored_path}"

    def get_signed_url(self, stored_path: str, expires_in: int = 3600) -> str:
        try:
            return self._client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self._bucket, "Key": stored_path},
                ExpiresIn=expires_in,
            )
        except ClientError as e:
            raise RuntimeError(f"S3 signed URL failed: {e}") from e

    def get_local_path(self, stored_path: str) -> Optional[Path]:
        return None
