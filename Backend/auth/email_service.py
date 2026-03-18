import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

def send_welcome_email(to_email: str, user_name: str):
    smtp_mail = os.getenv("smtp_mail")
    smtp_password = os.getenv("smtp_password")

    if not smtp_mail or not smtp_password:
        print("⚠️ [Email Service] SMTP credentials not found, skipping email.")
        return False

    try:
        # Create the email message
        msg = MIMEMultipart()
        msg['From'] = smtp_mail
        msg['To'] = to_email
        msg['Subject'] = "Welcome to PharmaAI - Account Verified!"

        # Create the HTML body
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #2563eb;">Welcome to PharmaAI, {user_name}!</h2>
                <p>Your account has been successfully created and verified.</p>
                <p>You can now log in to the platform and start exploring agentic AI for drug discovery and repurposing.</p>
                <br>
                <p>Best regards,<br>The PharmaAI Team</p>
            </div>
          </body>
        </html>
        """
        msg.attach(MIMEText(html, 'html'))

        # Connect to Gmail SMTP server
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(smtp_mail, smtp_password)
        server.send_message(msg)
        server.quit()
        
        print(f"📧 [Email Service] Verification email sent to {to_email}")
        return True
    except smtplib.SMTPRecipientsRefused:
        print(f"❌ [Email Service] Recipient refused: {to_email}")
        raise ValueError(f"The email address {to_email} does not exist or cannot receive emails.")
    except Exception as e:
        print(f"❌ [Email Service] Failed to send email to {to_email}: {e}")
        raise ValueError("Failed to deliver verification email. Please check if your email address is correct.")
