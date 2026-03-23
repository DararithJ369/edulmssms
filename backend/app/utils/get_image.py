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
        
        filename = re.sub(r'[^a-zA-Z0-9_.-]', '_', file.filename)
        file_path = os.path.join(directory, filename)
        
        if os.path.exists(file_path):
            base, ext = os.path.splitext(filename)
            counter = 1
            while os.path.exists(file_path):
                filename = f"{base}_{counter}{ext}"
                file_path = os.path.join(directory, filename)
                counter += 1
        
        print(f"🖼️ get_image - Saving to: {file_path}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        result_path = f"/uploads/images/{filename}"
        print(f"✅ get_image - Success! Saved and returning: {result_path}")
        return result_path
    except Exception as e:
        print(f"❌ get_image - Error: {str(e)}")
        raise