"""
Organizations API Router
"""
from fastapi import APIRouter, HTTPException
from database import get_db_cursor

router = APIRouter(prefix="/api/organizations", tags=["organizations"])


@router.get("")
async def get_organizations():
    """
    Get all active organizations
    Returns organizations for the provider group dropdown
    """
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
                ORDER BY organization_name ASC
            """)
            
            organizations = cursor.fetchall()
            
            return {
                "success": True,
                "data": organizations,
                "count": len(organizations)
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/{organization_id}")
async def get_organization_by_id(organization_id: int):
    """
    Get a specific organization by ID
    """
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
