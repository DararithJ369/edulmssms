import os
import re
import shutil


# validate file type
allowed_extensions = ["image/jpeg", "image/png", "image/gif", "image/jpg", "image/webp"]
directory = "uploads/images"

os.makedirs(directory, exist_ok=True)

def get_image(file):
    if file.content_type not in allowed_extensions:
        raise ValueError("Unsupported file type")
    
    filename = re.sub(r'[^a-zA-Z0-9_.-]', '_', file.filename)
    file_path = os.path.join(directory, filename)
    
    if os.path.exists(file_path):
        base, ext = os.path.splitext(filename)
        counter = 1
        while os.path.exists(file_path):
            filename = f"{base}_{counter}{ext}"
            file_path = os.path.join(directory, filename)
            counter += 1
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return file_path