import os
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

async def generate_certificate(
    student_name: str,
    course_name: str,
    certificate_title: str,
    instructor_name: str,
    issue_date: datetime,
    credential_id: str,
    template_path: str = None
) -> str:
    """
    Generate a certificate image and save it.
    Returns the path to the generated certificate.
    Uses a default template for all certificates.
    """
    try:
        # Create certificates folder if it doesn't exist
        certificates_folder = os.path.join(settings.UPLOAD_FOLDER, "certificates")
        os.makedirs(certificates_folder, exist_ok=True)
        
        # Generate unique filename
        filename = f"{credential_id}.png"
        file_path = os.path.join(certificates_folder, filename)
        
        # Check for default template
        default_template_path = os.path.join(settings.UPLOAD_FOLDER, "certificate_templates", "default_template.png")
        
        # Use default template if it exists, otherwise create a blank certificate
        if os.path.exists(default_template_path):
            img = Image.open(default_template_path)
        else:
            # Create a blank certificate
            img = Image.new('RGB', (1200, 900), color=(255, 255, 255))
            draw = ImageDraw.Draw(img)
            
            # Add border
            draw.rectangle([(20, 20), (1180, 880)], outline=(25, 164, 219), width=5)
        
        # Add text to the certificate
        draw = ImageDraw.Draw(img)
        
        # Try to load fonts, fall back to default if not available
        try:
            header_font = ImageFont.truetype("arial.ttf", 60)
            title_font = ImageFont.truetype("arial.ttf", 40)
            name_font = ImageFont.truetype("arial.ttf", 50)
            course_font = ImageFont.truetype("arial.ttf", 30)
            details_font = ImageFont.truetype("arial.ttf", 25)
            id_font = ImageFont.truetype("arial.ttf", 20)
        except IOError:
            header_font = ImageFont.load_default()
            title_font = ImageFont.load_default()
            name_font = ImageFont.load_default()
            course_font = ImageFont.load_default()
            details_font = ImageFont.load_default()
            id_font = ImageFont.load_default()
        
        # Add certificate header
        draw.text((600, 100), "Certificate of Completion", fill=(25, 164, 219), font=header_font, anchor="mm")
        
        # Add certificate title
        draw.text((600, 200), certificate_title, fill=(0, 0, 0), font=title_font, anchor="mm")
        
        # Add student name
        draw.text((600, 350), student_name, fill=(0, 0, 0), font=name_font, anchor="mm")
        
        # Add course name
        draw.text((600, 450), f"has successfully completed the course", fill=(0, 0, 0), font=course_font, anchor="mm")
        draw.text((600, 500), course_name, fill=(0, 0, 0), font=course_font, anchor="mm")
        
        # Add date and instructor
        draw.text((300, 650), f"Issue Date: {issue_date.strftime('%B %d, %Y')}", fill=(0, 0, 0), font=details_font, anchor="mm")
        draw.text((900, 650), f"Instructor: {instructor_name}", fill=(0, 0, 0), font=details_font, anchor="mm")
        
        # Add credential ID
        draw.text((600, 800), f"Credential ID: {credential_id}", fill=(0, 0, 0), font=id_font, anchor="mm")
        
        # Save the certificate
        img.save(file_path)
        
        # Return relative path
        return os.path.join("certificates", filename)
    
    except Exception as e:
        logger.error(f"Error generating certificate: {e}")
        raise e
