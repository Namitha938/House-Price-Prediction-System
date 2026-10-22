"""
SMTP Email Dispatch Service for ProphetVal.
Supports TLS/SSL authenticated SMTP delivery (e.g. Gmail, Outlook, AWS SES, Brevo, SendGrid).
"""
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any

from app.config import settings

logger = logging.getLogger(__name__)

def is_smtp_configured() -> bool:
    """Check if SMTP credentials are provided in settings."""
    user = settings.SMTP_USER or settings.SMTP_FROM_EMAIL
    return bool(user and settings.SMTP_PASSWORD and settings.SMTP_HOST)

def send_password_reset_email(to_email: str, code: str) -> Dict[str, Any]:
    """
    Send a secure 6-digit verification code to the recipient's email address via SMTP.
    Returns status dictionary indicating whether delivery succeeded.
    """
    if not is_smtp_configured():
        logger.info(
            f"SMTP not configured in environment. In-app verification code for {to_email} is: {code}"
        )
        return {
            "sent": False,
            "smtp_configured": False,
            "code": code,
            "message": "SMTP credentials are not configured in backend/.env yet. Verification code generated in-app."
        }

    from_addr = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
    from_header = f"{settings.SMTP_FROM_NAME} <{from_addr}>"
    subject = f"[{settings.PROJECT_NAME}] Your Password Reset Code: {code}"

    # Plain-text alternative
    text_content = f"""Hello,

You requested a password reset for your ProphetVal House Price Valuation account.

Your 6-digit security verification code is: {code}

This code is active for 15 minutes. If you did not make this request, you can safely ignore this email.

Best regards,
ProphetVal AI Team
"""

    # Modern responsive HTML message
    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #0f172a;
      color: #f8fafc;
    }}
    .email-wrapper {{
      max-width: 560px;
      margin: 30px auto;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
    }}
    .email-header {{
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      padding: 24px;
      text-align: center;
    }}
    .brand-title {{
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      margin: 0;
      letter-spacing: -0.02em;
    }}
    .brand-sub {{
      font-size: 13px;
      color: #bfdbfe;
      margin-top: 4px;
    }}
    .email-body {{
      padding: 28px 24px;
    }}
    .greeting {{
      font-size: 16px;
      font-weight: 600;
      color: #f1f5f9;
      margin-bottom: 12px;
    }}
    .instruction {{
      font-size: 14px;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 24px;
    }}
    .code-box {{
      background: #0f172a;
      border: 2px dashed #3b82f6;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin-bottom: 24px;
    }}
    .code-label {{
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #38bdf8;
      font-weight: 700;
      margin-bottom: 6px;
    }}
    .code-number {{
      font-size: 34px;
      font-weight: 900;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      color: #ffffff;
      letter-spacing: 0.35em;
    }}
    .footer-note {{
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
      border-top: 1px solid #334155;
      padding-top: 16px;
      margin-top: 20px;
    }}
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header">
      <div class="brand-title">🏡 ProphetVal AI</div>
      <div class="brand-sub">Residential Real Estate Valuation System</div>
    </div>
    <div class="email-body">
      <div class="greeting">Hello,</div>
      <div class="instruction">
        We received a request to reset the password for your ProphetVal account (<strong>{to_email}</strong>). Use the verification code below to complete your password update:
      </div>
      <div class="code-box">
        <div class="code-label">Verification Code (Expires in 15 mins)</div>
        <div class="code-number">{code}</div>
      </div>
      <div class="instruction" style="font-size: 13px;">
        If you did not request this verification code, someone may have typed your email by mistake. Your account remains completely secure.
      </div>
      <div class="footer-note">
        This is an automated security dispatch from ProphetVal AI Platform.<br/>
        Trained on Kaggle Ames Housing Dataset • FastAPI & Scikit-learn
      </div>
    </div>
  </div>
</body>
</html>
"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_header
    msg["To"] = to_email
    msg.attach(MIMEText(text_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    try:
        logger.info(f"Connecting to SMTP server {settings.SMTP_HOST}:{settings.SMTP_PORT}...")
        if settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
            if settings.SMTP_USE_TLS:
                server.starttls()

        smtp_user = (settings.SMTP_USER or settings.SMTP_FROM_EMAIL or "").strip()
        smtp_password = settings.SMTP_PASSWORD.replace(" ", "").strip()
        server.login(smtp_user, smtp_password)
        server.sendmail(from_addr, [to_email], msg.as_string())
        server.quit()

        logger.info(f"Successfully dispatched SMTP password reset email to {to_email}")
        return {
            "sent": True,
            "smtp_configured": True,
            "message": f"Password reset verification code successfully sent to {to_email} via SMTP."
        }
    except Exception as e:
        logger.error(f"Failed to dispatch email via SMTP: {e}")
        return {
            "sent": False,
            "smtp_configured": True,
            "error": str(e),
            "code": code,
            "message": f"SMTP transmission error: {str(e)}"
        }

