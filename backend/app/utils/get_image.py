import cloudinary.uploader
from fastapi import UploadFile
from app.utils.upload_validator import validate_upload

def get_image(file: UploadFile) -> str:
    # Validate image file size and type
    validate_upload(file, allowed_categories=["image"])
    
    try:
        print(f"☁️ Cloudinary Upload - Processing file: {file.filename}, Content-Type: {file.content_type}")
        
        # Ensure file pointer is at the beginning
        file.file.seek(0)
        
        # Perform unsigned upload using the predefined preset and cloud name
        upload_result = cloudinary.uploader.unsigned_upload(
            file.file,
            upload_preset="lms_preset",
            cloud_name="dlykcgjdh",
            resource_type="auto"
        )
        
        secure_url = upload_result.get("secure_url")
        print(f"✅ Cloudinary Upload - Success! Saved and returning: {secure_url}")
        return secure_url
    except Exception as e:
        print(f"❌ Cloudinary Upload - Error: {str(e)}")
        raise