import os
from fastapi import UploadFile, HTTPException, status

# Whitelists definitions
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_IMAGE_MIMES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}

ALLOWED_DOC_EXTENSIONS = {".pdf", ".docx", ".pptx", ".xlsx"}
ALLOWED_DOC_MIMES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}

ALLOWED_VIDEO_EXTENSIONS = {".mp4"}
ALLOWED_VIDEO_MIMES = {"video/mp4"}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def validate_upload(file: UploadFile, allowed_categories: list[str]) -> None:
    """
    Validates uploaded file size, extension, and MIME type.
    Allowed categories: "image", "document", "video"
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file uploaded or file name is missing."
        )

    # 1. Size validation
    try:
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read file size: {str(e)}"
        )

    if size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds the maximum limit of 10MB (size: {size / (1024*1024):.2f}MB)."
        )

    # 2. Extension and MIME validation
    ext = os.path.splitext(file.filename)[1].lower()
    content_type = file.content_type or ""

    allowed_exts = set()
    allowed_mimes = set()

    for category in allowed_categories:
        cat_lower = category.lower()
        if cat_lower == "image":
            allowed_exts.update(ALLOWED_IMAGE_EXTENSIONS)
            allowed_mimes.update(ALLOWED_IMAGE_MIMES)
        elif cat_lower == "document":
            allowed_exts.update(ALLOWED_DOC_EXTENSIONS)
            allowed_mimes.update(ALLOWED_DOC_MIMES)
        elif cat_lower == "video":
            allowed_exts.update(ALLOWED_VIDEO_EXTENSIONS)
            allowed_mimes.update(ALLOWED_VIDEO_MIMES)

    # Validate extension
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '{ext}' is not allowed. Supported extensions: {', '.join(sorted(allowed_exts))}"
        )

    # Validate MIME type (allow generic application/octet-stream or empty MIME as fallback if extension matches)
    if content_type and content_type != "application/octet-stream":
        if content_type not in allowed_mimes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type '{content_type}' is not allowed for category: {', '.join(allowed_categories)}."
            )
