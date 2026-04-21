import os
import uuid
from fastapi import UploadFile 
from app.core.config import settings
import logging


logger = logging.getLogger(__name__)

async def save_uploaded_file(upload_file: UploadFile, folder: str) -> str:
    """
    Save uploaded file to the specified folder. 
    Returns the relative path of the saved file.
    """
    try:
        # create folder if it doesn't exist
        folder_path = os.path.join(settings.UPLOAD_DIR, folder)
        os.makedirs(folder_path, exist_ok=True)
        
        # generate unique filename
        file_extension = os.path.splitext(upload_file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # save file
        file_path = os.path.join(folder_path, unique_filename)
        
        # read file content
        contents = await upload_file.read()
        
        # write file to disk
        with open(file_path, "wb") as f:
            f.write(contents)
            
        # return relative path 
        return os.path.join(folder, unique_filename)
        
    except Exception as e:
        logger.error(f"Failed to create folder {folder_path}: {e}")
        raise e