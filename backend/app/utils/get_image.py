from fastapi import UploadFile
from app.utils.cloudinary_upload import upload_to_cloudinary


def get_image(file: UploadFile) -> str:
    # Validate image file size and type, then upload to Cloudinary
    return upload_to_cloudinary(
        file,
        allowed_categories=["image"],
        resource_type="image",
    )