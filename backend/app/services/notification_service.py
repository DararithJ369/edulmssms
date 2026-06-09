import asyncio
import logging
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.user import User
from app.utils.email import send_email

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    def create_notification(
        db: Session,
        user_id: str,
        title: str,
        message: str,
        type: str,
        reference_id: int = None,
        background_tasks = None
    ) -> Notification:
        """
        Save an in-app notification record and send an SMTP email.
        """
        # Create database entry
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            reference_id=reference_id
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)

        # Retrieve target user email address
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.email:
            subject = f"[LMS Alert] {title}"
            html_content = f"""
            <html>
                <body style="font-family: sans-serif; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                        <h2 style="color: #0038A8; margin-top: 0;">LMS Notification Alert</h2>
                        <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 20px;" />
                        <h3 style="margin-bottom: 8px;">{title}</h3>
                        <p style="font-size: 14px; line-height: 1.6; color: #555;">{message}</p>
                        <br />
                        <a href="http://localhost:3000" style="display: inline-block; padding: 10px 20px; background-color: #0038A8; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 12px;">Go to LMS Dashboard</a>
                        <p style="font-size: 10px; color: #999; margin-top: 40px;">This is an automated notification from the Learning Management System.</p>
                    </div>
                </body>
            </html>
            """
            text_content = f"{title}\n\n{message}\n\nAccess the LMS at http://localhost:3000"

            if background_tasks:
                background_tasks.add_task(
                    send_email,
                    email_to=user.email,
                    subject=subject,
                    html_content=html_content,
                    text_content=text_content
                )
            else:
                try:
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        loop.create_task(send_email(user.email, subject, html_content, text_content))
                    else:
                        loop.run_until_complete(send_email(user.email, subject, html_content, text_content))
                except Exception as e:
                    logger.debug("Event loop unavailable for email send, falling back to asyncio.run: %s", e)
                    try:
                        asyncio.run(send_email(user.email, subject, html_content, text_content))
                    except Exception as err:
                        logger.error("Failed to deliver email to %s: %s", user.email, err)
        return notif
