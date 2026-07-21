"""Centralized Cloudinary upload helper.

Reads Cloudinary configuration from environment variables via settings.
If CLOUDINARY_API_SECRET is provided, signed uploads are used.
Otherwise, unsigned uploads are used with the configured upload preset.
"""
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException
from app.config.config import settings


def _ensure_configured():
    """Ensure Cloudinary SDK is configured from settings."""
    cloud_name = cloudinary.config().cloud_name or settings.CLOUDINARY_CLOUD_NAME
    if not cloud_name:
        raise RuntimeError("CLOUDINARY_CLOUD_NAME is not configured")

    # Only reconfigure if cloud_name is not already set (e.g., from env vars)
    if not cloudinary.config().cloud_name:
        config_kwargs = {"cloud_name": cloud_name}
        if settings.CLOUDINARY_API_KEY:
            config_kwargs["api_key"] = settings.CLOUDINARY_API_KEY
        if settings.CLOUDINARY_API_SECRET:
            config_kwargs["api_secret"] = settings.CLOUDINARY_API_SECRET
        cloudinary.config(**config_kwargs)


def upload_to_cloudinary(
    file: UploadFile,
    folder: str = "",
    resource_type: str = "auto",
    allowed_categories: list[str] | None = None,
    max_size_mb: int = 50,
) -> str:
    """Upload a file to Cloudinary and return the secure_url.

    Args:
        file: The FastAPI UploadFile to upload.
        folder: Optional Cloudinary folder path.
        resource_type: Cloudinary resource type ("auto", "image", "video", "raw").
        allowed_categories: Categories to validate against ("image", "document", "video").
        max_size_mb: Maximum allowed file size in megabytes.

    Returns:
        The Cloudinary secure_url of the uploaded file.
    """
    from app.utils.upload_validator import validate_upload

    _ensure_configured()

    if allowed_categories:
        validate_upload(file, allowed_categories=allowed_categories)

    # Enforce size limit
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    max_bytes = max_size_mb * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large: {file_size} bytes exceeds {max_size_mb} MB limit",
        )

    upload_options = {
        "resource_type": resource_type,
    }
    if folder:
        upload_options["folder"] = folder

    try:
        if settings.CLOUDINARY_API_SECRET:
            # Prefer signed uploads when API secret is available
            upload_result = cloudinary.uploader.upload(file.file, **upload_options)
        else:
            # Fallback to unsigned uploads using the configured preset
            preset = settings.CLOUDINARY_UPLOAD_PRESET
            if not preset:
                raise RuntimeError(
                    "CLOUDINARY_UPLOAD_PRESET is required for unsigned uploads"
                )
            upload_result = cloudinary.uploader.unsigned_upload(
                file.file,
                upload_preset=preset,
                **upload_options,
            )

        secure_url = upload_result.get("secure_url")
        if not secure_url:
            raise RuntimeError("Cloudinary upload did not return a secure_url")
        return secure_url
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Cloudinary upload failed: {str(e)}",
        ) from e
