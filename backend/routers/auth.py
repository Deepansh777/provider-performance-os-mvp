"""
Authentication router for AWS Cognito integration
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from database import get_db_connection
from auth import verify_cognito_token, get_user_email_from_token

router = APIRouter(prefix="/api/auth", tags=["authentication"])


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


def get_current_user_from_token(authorization: str = Header(None)):
    """Dependency to extract and verify user from Cognito JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    payload = verify_cognito_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return payload


@router.get("/verify", response_model=VerifyResponse)
async def verify(user_data: dict = Depends(get_current_user_from_token)):
    """
    Verify Cognito JWT token and return user information from database
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Extract email from Cognito token
        email = user_data.get('email') or user_data.get('username')
        
        if not email:
            raise HTTPException(status_code=401, detail="No email found in token")
        
        # Get user data from database
        cursor.execute("""
            SELECT id, email, full_name, role, organization_id, active_flag, login_enabled
            FROM users
            WHERE email = %s
        """, (email,))
        
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found in database. Please contact administrator.")
        
        user_id, email, full_name, role, org_id, active_flag, login_enabled = user
        
        if not active_flag:
            raise HTTPException(status_code=403, detail="User account is inactive")
        
        if not login_enabled:
            raise HTTPException(status_code=403, detail="Login is currently disabled for this account")
        
        # Update last login
        cursor.execute("""
            UPDATE users 
            SET last_login = %s 
            WHERE id = %s
        """, (datetime.now(), user_id))
        conn.commit()
        
        user_info = {
            "id": user_id,
            "email": email,
            "full_name": full_name,
            "role": role,
            "organization_id": org_id
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
    finally:
        cursor.close()
        conn.close()


@router.get("/me")
async def get_current_user(user_data: dict = Depends(get_current_user_from_token)):
    """
    Get current user information from Cognito JWT token and database
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Extract email from Cognito token
        email = user_data.get('email') or user_data.get('username')
        
        if not email:
            raise HTTPException(status_code=401, detail="No email found in token")
        
        # Get user data from database
        cursor.execute("""
            SELECT id, email, full_name, role, organization_id
            FROM users
            WHERE email = %s AND active_flag = TRUE AND login_enabled = TRUE
        """, (email,))
        
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id, email, full_name, role, org_id = user
        
        return {
            "success": True,
            "user": {
                "id": user_id,
                "email": email,
                "full_name": full_name,
                "role": role,
                "organization_id": org_id,
                "cognito_sub": user_data.get('sub')
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get user error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        cursor.close()
        conn.close()


@router.post("/sync-user", response_model=MessageResponse)
async def sync_user(
    request: SyncUserRequest,
    user_data: dict = Depends(get_current_user_from_token)
):
    """
    Sync user information from Cognito to local database
    This can be called after first Cognito login to update user details
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        email = user_data.get('email') or user_data.get('username')
        
        # Update user full_name if it exists
        cursor.execute("""
            UPDATE users 
            SET full_name = %s
            WHERE email = %s
        """, (request.full_name, email))
        
        conn.commit()
        
        return MessageResponse(
            success=True,
            message="User information synced successfully"
        )
        
    except Exception as e:
        print(f"Sync user error: {e}")
        raise HTTPException(status_code=500, detail="Failed to sync user information")
    finally:
        cursor.close()
        conn.close()

