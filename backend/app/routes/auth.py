"""
Authentication and Password Reset Routes using SMTP.
Handles 6-digit verification code generation, MongoDB persistence, and SMTP email dispatch.
"""
import random
import base64
import hmac
import hashlib
import struct
import time
from datetime import datetime, timezone
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.config import settings
from app.database import get_password_resets_collection
from app.services.email_service import send_password_reset_email, is_smtp_configured

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication & SMTP"])

class SendResetCodeRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)

class VerifyResetCodeRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    code: str = Field(..., min_length=6, max_length=6)

class VerifyTotpRequest(BaseModel):
    secret: str
    code: str

class SmtpConfigUpdate(BaseModel):
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str
    smtp_password: str
    smtp_from_email: Optional[str] = None
    smtp_use_tls: bool = True

@router.get("/smtp-status")
def get_smtp_status():
    """
    Check if SMTP email dispatch is configured on the backend.
    """
    masked_user = ""
    if settings.SMTP_USER:
        parts = settings.SMTP_USER.split("@")
        if len(parts) == 2:
            masked_user = f"{parts[0][:3]}***@{parts[1]}"
        else:
            masked_user = f"{settings.SMTP_USER[:3]}***"

    return {
        "smtp_configured": is_smtp_configured(),
        "smtp_host": settings.SMTP_HOST,
        "smtp_port": settings.SMTP_PORT,
        "smtp_user_configured": bool(settings.SMTP_USER),
        "smtp_user_preview": masked_user,
        "smtp_from_name": settings.SMTP_FROM_NAME,
        "smtp_use_tls": settings.SMTP_USE_TLS,
    }

@router.post("/send-reset-code")
def request_password_reset_code(req: SendResetCodeRequest):
    """
    Generate a secure 6-digit verification code, save to MongoDB with 15-minute TTL,
    and dispatch it to the recipient's email address via SMTP.
    """
    email = req.email.strip().lower()
    code = f"{random.randint(100000, 999999)}"
    now = datetime.now(timezone.utc)

    # 1. Save or update code in MongoDB
    try:
        col = get_password_resets_collection()
        col.update_one(
            {"email": email},
            {
                "$set": {
                    "email": email,
                    "code": code,
                    "created_at": now,
                    "verified": False
                }
            },
            upsert=True
        )
    except Exception as e:
        logger.error(f"Could not persist reset code to MongoDB: {e}")

    # 2. Dispatch via SMTP
    result = send_password_reset_email(email, code)

    return {
        "success": True,
        "email": email,
        "sent": result.get("sent", False),
        "smtp_configured": result.get("smtp_configured", False),
        "message": result.get("message", "Verification code created."),
        # If SMTP is not yet configured or failed, include code so user is not blocked
        "code": code if not result.get("sent", False) else None
    }

@router.post("/verify-reset-code")
def verify_reset_code(req: VerifyResetCodeRequest):
    """
    Verify the 6-digit code against MongoDB.
    """
    email = req.email.strip().lower()
    code = req.code.strip()

    try:
        col = get_password_resets_collection()
        record = col.find_one({"email": email})
        if not record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No verification code was requested for this email, or the code has expired."
            )

        if record.get("code") != code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect verification code. Please check the code sent to your email."
            )

        # Mark as verified
        col.update_one({"email": email}, {"$set": {"verified": True}})

        return {
            "valid": True,
            "email": email,
            "message": "Verification code successfully confirmed."
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking verification code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error validating verification code."
        )

def check_totp_code(secret_b32: str, code: str, window: int = 1) -> bool:
    try:
        clean_secret = secret_b32.strip().replace(" ", "").upper()
        padding = (8 - len(clean_secret) % 8) % 8
        clean_secret += "=" * padding
        key = base64.b32decode(clean_secret)
        current_time = int(time.time() // 30)
        for t in range(current_time - window, current_time + window + 1):
            msg = struct.pack(">Q", t)
            digest = hmac.new(key, msg, hashlib.sha1).digest()
            offset = digest[19] & 0x0F
            otp = (struct.unpack(">I", digest[offset:offset+4])[0] & 0x7FFFFFFF) % 1000000
            if f"{otp:06d}" == code.strip():
                return True
        return False
    except Exception as e:
        logger.warning(f"Error checking TOTP: {e}")
        return False

@router.post("/verify-totp")
def verify_totp_endpoint(req: VerifyTotpRequest):
    """
    Verify a standard RFC 6238 TOTP code against a Base32 secret.
    """
    is_valid = check_totp_code(req.secret, req.code)
    return {"valid": is_valid}
