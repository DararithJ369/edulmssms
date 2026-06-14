import os
import re
import uuid
import shutil
import boto3
from pathlib import Path
from typing import Optional
from botocore.exceptions import ClientError
from fastapi import UploadFile
from app.config.config import settings

class StorageService:
    _s3_client = None

    @classmethod
    def _get_s3_client(cls):
        if cls._s3_client is None:
            kwargs = {}
            if settings.AWS_ACCESS_KEY_ID:
                kwargs['aws_access_key_id'] = settings.AWS_ACCESS_KEY_ID
            if settings.AWS_SECRET_ACCESS_KEY:
                kwargs['aws_secret_access_key'] = settings.AWS_SECRET_ACCESS_KEY
            if settings.AWS_REGION:
                kwargs['region_name'] = settings.AWS_REGION
            if settings.AWS_ENDPOINT_URL:
                kwargs['endpoint_url'] = settings.AWS_ENDPOINT_URL
            
            cls._s3_client = boto3.client('s3', **kwargs)
        return cls._s3_client

    @classmethod
    def _upload_file(cls, file: UploadFile, prefix: str, folder: str = "") -> str:
        import cloudinary.uploader
        try:
            file.file.seek(0)
            upload_result = cloudinary.uploader.unsigned_upload(
                file.file,
                upload_preset="lms_preset",
                cloud_name="dlykcgjdh",
                resource_type="auto"
            )
            return upload_result.get("secure_url")
        except Exception as e:
            print(f"Error uploading file to Cloudinary: {e}")
            raise e

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
        
        if settings.CLOUDFRONT_URL:
            cdn_url = settings.CLOUDFRONT_URL.rstrip("/")
            return f"{cdn_url}/{stored_path}"
        
        bucket = settings.AWS_BUCKET_NAME or "lms-bucket"
        if settings.AWS_ENDPOINT_URL:
            endpoint = settings.AWS_ENDPOINT_URL.rstrip("/")
            return f"{endpoint}/{bucket}/{stored_path}"
            
        region = settings.AWS_REGION or "us-east-1"
        return f"https://{bucket}.s3.{region}.amazonaws.com/{stored_path}"

    @classmethod
    def generate_signed_url(cls, stored_path: str, expires_in: int = 3600) -> str:
        if settings.STORAGE_PROVIDER == "local":
            api_prefix = settings.API_V1_STR
            return f"{api_prefix}/storage/private/{stored_path}"
        
        s3 = cls._get_s3_client()
        bucket = settings.AWS_BUCKET_NAME or "lms-bucket"
        try:
            url = s3.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': bucket,
                    'Key': stored_path
                },
                ExpiresIn=expires_in
            )
            return url
        except ClientError as e:
            print(f"Error generating presigned URL: {e}")
            return stored_path

    @classmethod
    def get_local_path(cls, stored_path: str) -> Path:
        backend_root = Path(__file__).parent.parent.parent.parent
        return backend_root / "uploads" / stored_path

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
