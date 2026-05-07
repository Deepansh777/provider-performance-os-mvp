"""
Organizations API Router
Implements role-based access control:
- admin role: Can see all organizations
- client role: Can only see their own organization
"""
from fastapi import APIRouter, HTTPException, Depends
from database import get_db_cursor
from auth import get_current_user

router = APIRouter(prefix="/api/organizations", tags=["organizations"])


@router.get("")
async def get_organizations(user: dict = Depends(get_current_user)):
    """
    Get organizations based on user role
    - Admins: Get all active organizations
    - Clients: Get only their own organization
    """
    try:
        with get_db_cursor() as cursor:
            # Admin users can see all organizations
            if user["role"] == "admin":
                cursor.execute("""
                    SELECT 
                        id,
                        organization_name,
                        organization_type,
                        market,
                        state
                    FROM organizations
                    ORDER BY organization_name ASC
                """)
            else:
                # Client users can only see their own organization
                cursor.execute("""
                    SELECT 
                        id,
                        organization_name,
                        organization_type,
                        market,
                        state
                    FROM organizations
                    WHERE id = %s
                """, (user["organization_id"],))
            
            organizations = cursor.fetchall()
            
            return {
                "success": True,
                "data": organizations,
                "count": len(organizations)
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/{organization_id}")
async def get_organization_by_id(organization_id: int, user: dict = Depends(get_current_user)):
    """
    Get a specific organization by ID
    - Admins: Can access any organization
    - Clients: Can only access their own organization
    """
    # Access control check for client users
    if user["role"] != "admin" and user["organization_id"] != organization_id:
        raise HTTPException(
            status_code=403, 
            detail="You do not have permission to access this organization"
        )
    
    try:
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT 
                    id,
                    organization_name,
                    organization_type,
                    market,
                    state
                FROM organizations
                WHERE id = %s
            """, (organization_id,))
            
            organization = cursor.fetchone()
            
            if not organization:
                raise HTTPException(status_code=404, detail="Organization not found")
            
            return {
                "success": True,
                "data": organization
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
