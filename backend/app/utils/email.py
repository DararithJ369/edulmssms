import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger(__name__)

async def send_email(
    email_to: str,
    subject: str,
    html_content: str,
    text_content: str = None
) -> None:
    """
    Send an email using SMTP. 
    """
    if not settings.STMP_HOST or not settings.SMTP_PORT:
        logger.warning("SMTP settings are not configured. Email will not be sent.")
        return
    
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    message["To"] = email_to
    
    if text_content:
        message.attach(MIMEText(text_content, "plain"))
    
    message.attach(MIMEText(html_content, "html"))
    
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_TLS:
                server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(
                settings.SMTP_FROM_EMAIL, 
                email_to, 
                message.as_string()
            )
        logger.info(f"Email sent to {email_to}")
    except Exception as e:
        logger.error(f"Failed to send email to {email_to}: {e}")
        raise e
    
    
async def send_password_reset_email(email_to: str, otp: str) -> None:
    """
    Send a password reset email with OTP.
    """
    subject = "Password Reset Request"
    html_content = f"""
    <html>
        <body>
            <p>Hi,</p>
            <p>You requested a password reset. Use the following OTP to reset your password:</p>
            <h2>{otp}</h2>
            <p>This OTP is valid for 15 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
        </body>
    </html>
    """
    text_content = f"""
    Hi,
    
    You requested a password reset. Use the following OTP to reset your password:
    
    {otp}
    
    This OTP is valid for 15 minutes.
    
    If you did not request this, please ignore this email.
    """
    
    await send_email(
        email_to=email_to, 
        subject=subject, 
        html_content=html_content, 
        text_content=text_content
    )
    
    
async def send_verification_email(email: str) -> None:
    """
    Send an email verification link.
    """
    subject = "Email Verification"
    html_content = f"""
    <html>
        <body>
            <h1>Welcome to {settings.PROJECT_NAME}!</h1>
            <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
            <a href="http://localhost:3000/verify-email?email={email}">Verify Email</a>
            <p>If you did not create an account, please ignore this email.</p>
        </body>
    </html>
    """
    text_content = f"""
    Welcome to {settings.PROJECT_NAME}!
    
    Thank you for registering. Please verify your email address by clicking the link below:
    
    http://localhost:3000/verify-email?email={email}
    
    If you did not create an account, please ignore this email.
    """
    
    await send_email(
        email_to=email, 
        subject=subject, 
        html_content=html_content, 
        text_content=text_content
    )