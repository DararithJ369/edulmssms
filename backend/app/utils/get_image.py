import os
import re
import shutil
from pathlib import Path

# validate file type
allowed_extensions = ["image/jpeg", "image/png", "image/gif", "image/jpg", "image/webp"]

# Get the backend root directory (parent of the app directory)
backend_root = Path(__file__).parent.parent.parent
uploads_dir = backend_root / "uploads" / "images"
directory = str(uploads_dir)

print(f"🖼️ get_image - Uploads directory: {directory}")
os.makedirs(directory, exist_ok=True)

def get_image(file):
    try:
        print(f"🖼️ get_image - Processing file: {file.filename}, Content-Type: {file.content_type}")
        
        if file.content_type not in allowed_extensions:
            raise ValueError(f"Unsupported file type: {file.content_type}")
        
        from app.services.storage import StorageService
        stored_path = StorageService.upload_public_file(file, folder="images")
        
        print(f"✅ get_image - Success! Saved and returning: {stored_path}")
        return stored_path
    except Exception as e:
        print(f"❌ get_image - Error: {str(e)}")
        raise