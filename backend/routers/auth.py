"""
Authentication router for AWS Cognito integration
"""
import os
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr
from database import get_db_connection
from auth import get_current_user

router = APIRouter(prefix="/api/auth", tags=["authentication"])

# Check if auth is disabled (dev mode)
DISABLE_AUTH = os.getenv("REACT_APP_DISABLE_AUTH", "false").lower() == "true"


# Response Models
class VerifyResponse(BaseModel):
    success: bool
    user: Optional[dict] = None
    message: Optional[str] = None


class SyncUserRequest(BaseModel):
    email: EmailStr
    full_name: str


class MessageResponse(BaseModel):
    success: bool
    message: str


def log_user_action(
    user_id: int,
    user_email: str,
    action: str,
    organization_id: int,
    success: bool = True,
    error_message: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """
    Log user actions to audit_log table
    Skips logging if REACT_APP_DISABLE_AUTH is true (dev mode)
    
    Args:
        user_id: User's database ID
        user_email: User's email address
        action: Action type (e.g., 'login', 'view_provider', 'switch_org')
        organization_id: Organization ID being accessed
        success: Whether the action was successful
        error_message: Error message if action failed
        resource_type: Type of resource accessed (e.g., 'provider', 'organization')
        resource_id: ID of resource accessed
        ip_address: Client IP address
        user_agent: Client user agent string
    """
    # Skip logging in dev mode
    if DISABLE_AUTH:
        return
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO audit_log (
                user_id, user_email, action, organization_id, success,
                error_message, resource_type, resource_id, ip_address, user_agent
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id, user_email, action, organization_id, success,
            error_message, resource_type, resource_id, ip_address, user_agent
        ))
        conn.commit()
    except Exception as e:
        print(f"Error logging audit entry: {e}")
        # Don't fail the request if logging fails
    finally:
        cursor.close()
        conn.close()


@router.get("/verify", response_model=VerifyResponse)
async def verify(request: Request, user: dict = Depends(get_current_user)):
    """
    Verify Cognito JWT token and return user information from database
    Logs successful logins to audit_log
    """
    try:
        # Log successful login
        log_user_action(
            user_id=user["id"],
            user_email=user["email"],
            action="login",
            organization_id=user["organization_id"],
            success=True,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        
        user_info = {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "organization_id": user["organization_id"]
        }
        
        return VerifyResponse(
            success=True,
            user=user_info,
            message="Token is valid"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Verify error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """
    Get current user information from Cognito JWT token and database
    """
    return {
        "success": True,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "organization_id": user["organization_id"]
        }
    }