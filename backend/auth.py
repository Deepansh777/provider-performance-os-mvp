"""
Authentication utilities for AWS Cognito JWT token verification
"""
import os
from typing import Optional, Dict, Any
from fastapi import Header, HTTPException
from jose import jwt
from jose.exceptions import JWTError, ExpiredSignatureError
import requests
import json
from database import get_db_connection

# AWS Cognito Configuration
COGNITO_REGION = os.getenv("COGNITO_REGION", "us-east-1")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "us-east-1_zk3y8XtoK")
COGNITO_APP_CLIENT_ID = os.getenv("COGNITO_APP_CLIENT_ID", "")  # Set this in your environment

# Construct the JWKS URL
JWKS_URL = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"

# Cache for JWKS keys
_jwks_cache = None


def get_jwks_keys():
    """Fetch and cache JWKS keys from Cognito"""
    global _jwks_cache
    
    if _jwks_cache is None:
        try:
            response = requests.get(JWKS_URL, timeout=5)
            response.raise_for_status()
            _jwks_cache = response.json()
        except Exception as e:
            print(f"Error fetching JWKS keys: {e}")
            raise
    
    return _jwks_cache


def verify_cognito_token(token: str) -> Optional[dict]:
    """
    Verify a Cognito JWT token and return the payload
    
    Args:
        token: The JWT token from Cognito
        
    Returns:
        The decoded token payload if valid, None otherwise
    """
    try:
        # Get the JWKS keys
        jwks = get_jwks_keys()
        
        # Decode the token header to get the kid
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get('kid')
        
        if not kid:
            print("No kid in token header")
            return None
        
        # Find the matching key
        key = None
        for jwk_key in jwks.get('keys', []):
            if jwk_key.get('kid') == kid:
                key = jwk_key
                break
        
        if not key:
            print(f"No matching key found for kid: {kid}")
            return None
        
        # Verify and decode the token
        payload = jwt.decode(
            token,
            key,
            algorithms=['RS256'],
            audience=COGNITO_APP_CLIENT_ID if COGNITO_APP_CLIENT_ID else None,
            options={"verify_aud": bool(COGNITO_APP_CLIENT_ID)}
        )
        
        # Verify the issuer
        expected_issuer = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}"
        if payload.get('iss') != expected_issuer:
            print(f"Invalid issuer: {payload.get('iss')}")
            return None
        
        # Verify token_use is 'access' or 'id'
        token_use = payload.get('token_use')
        if token_use not in ['access', 'id']:
            print(f"Invalid token_use: {token_use}")
            return None
        
        return payload
        
    except ExpiredSignatureError:
        print("Token has expired")
        return None
    except JWTError as e:
        print(f"JWT verification error: {e}")
        return None


def get_user_from_database(email: str) -> Optional[Dict[str, Any]]:
    """
    Get user data from database by email
    
    Args:
        email: User's email address
        
    Returns:
        User data dictionary if found and active, None otherwise
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, email, full_name, role, organization_id, active_flag
            FROM users
            WHERE email = %s
        """, (email,))
        
        user_row = cursor.fetchone()
        
        if not user_row:
            return None
        
        user_id, email, full_name, role, org_id, active_flag = user_row
        
        if not active_flag:
            return None
        
        return {
            "id": user_id,
            "email": email,
            "full_name": full_name,
            "role": role,
            "organization_id": org_id,
            "active_flag": active_flag
        }
    finally:
        cursor.close()
        conn.close()


def get_current_user(authorization: str = Header(None)) -> Dict[str, Any]:
    """
    FastAPI dependency to extract and verify user from Cognito JWT token
    
    This is the main authentication dependency that should be used in all protected routes.
    It verifies the token, checks the user exists in database, and returns user data.
    
    Args:
        authorization: Authorization header with Bearer token
        
    Returns:
        User data dictionary with id, email, full_name, role, organization_id
        
    Raises:
        HTTPException: 401 if token is missing/invalid or user not found/inactive
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, 
            detail="Missing or invalid authorization header"
        )
    
    token = authorization.replace("Bearer ", "")
    payload = verify_cognito_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=401, 
            detail="Invalid or expired token"
        )
    
    # Extract email from token
    email = payload.get('email') or payload.get('username')
    
    if not email:
        raise HTTPException(
            status_code=401, 
            detail="No email found in token"
        )
    
    # Get user from database
    user = get_user_from_database(email)
    
    if not user:
        raise HTTPException(
            status_code=403, 
            detail="User not found or account is inactive"
        )
    
    return user