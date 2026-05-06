"""
Authentication utilities for AWS Cognito JWT token verification
"""
import os
from typing import Optional
from jose import jwt
from jose.exceptions import JWTError, ExpiredSignatureError
import requests
import json

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
    except Exception as e:
        print(f"Unexpected error verifying token: {e}")
        return None


def get_user_email_from_token(token: str) -> Optional[str]:
    """
    Extract user email from Cognito token
    
    Args:
        token: The JWT token from Cognito
        
    Returns:
        The user's email if found, None otherwise
    """
    payload = verify_cognito_token(token)
    if not payload:
        return None
    
    # Email can be in 'email' or 'username' field depending on token type
    return payload.get('email') or payload.get('username')


def get_user_sub_from_token(token: str) -> Optional[str]:
    """
    Extract user sub (unique identifier) from Cognito token
    
    Args:
        token: The JWT token from Cognito
        
    Returns:
        The user's sub (unique ID) if found, None otherwise
    """
    payload = verify_cognito_token(token)
    if not payload:
        return None
    
    return payload.get('sub')

