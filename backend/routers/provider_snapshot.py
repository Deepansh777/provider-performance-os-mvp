"""
Provider Snapshot API Router
Provides executive-level provider performance summary
Implements role-based access control:
- admin role: Can see all providers
- client role: Can only see providers from their organization
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
from datetime import date
from database import get_db_cursor
from auth import get_current_user

router = APIRouter(prefix="/api/providers", tags=["providers"])


@router.get("/{provider_id}/snapshot")
async def get_provider_snapshot(
    provider_id: int,
    user: dict = Depends(get_current_user),
    reporting_period: Optional[str] = Query(
        default="2025-12-31",
        description="Reporting period in YYYY-MM-DD format"
    )
):
    """
    Get provider snapshot with key metrics
    
    Access Control:
    - Admins: Can access any provider
    - Clients: Can only access providers from their organization
    
    Returns:
    - Provider information
    - Reporting period details
    - Attributed member count
    - Net member change
    - Average risk score
    - Domain performance summary
    
    SQL Injection Protection:
    - All parameters are passed using parameterized queries (%s placeholders)
    - Type validation via FastAPI (provider_id as int)
    - Date validation via SQL DATE casting
    """
    try:
        # Validate date format (additional security layer)
        try:
            date.fromisoformat(reporting_period)
        except ValueError:
            raise HTTPException(
                status_code=400, 
                detail="Invalid date format. Use YYYY-MM-DD"
            )
        
        with get_db_cursor() as cursor:
            # First check if provider exists and get its organization_id
            cursor.execute("""
                SELECT organization_id, active_flag 
                FROM providers 
                WHERE id = %s
            """, (provider_id,))
            
            provider_check = cursor.fetchone()
            
            if not provider_check:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Provider {provider_id} not found"
                )
            
            provider_org_id = provider_check['organization_id']
            provider_active = provider_check['active_flag']
            
            # Access control check for client users
            if user["role"] != "admin" and user["organization_id"] != provider_org_id:
                raise HTTPException(
                    status_code=403, 
                    detail="You do not have permission to access this provider"
                )
            
            if not provider_active:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Provider {provider_id} is inactive"
                )
            
            # Main snapshot query using parameterized queries
            # NO string concatenation - 100% injection-safe
            cursor.execute("""
                WITH current_attribution AS (
                    -- Current month attributed members
                    SELECT 
                        ma.provider_id,
                        COUNT(DISTINCT ma.member_id) as current_members,
                        AVG(m.risk_score) as avg_risk_score
                    FROM member_attribution ma
                    INNER JOIN members m ON ma.member_id = m.id
                    WHERE ma.provider_id = %s
                        AND ma.attribution_month = DATE_TRUNC('month', %s::DATE)
                        AND ma.attribution_status = 'active'
                    GROUP BY ma.provider_id
                ),
                prior_attribution AS (
                    -- 12 months prior attributed members
                    SELECT 
                        ma.provider_id,
                        COUNT(DISTINCT ma.member_id) as prior_members
                    FROM member_attribution ma
                    WHERE ma.provider_id = %s
                        AND ma.attribution_month = DATE_TRUNC('month', %s::DATE - INTERVAL '12 months')
                        AND ma.attribution_status = 'active'
                    GROUP BY ma.provider_id
                ),
                domain_performance AS (
                    -- Domain scores for the provider
                    SELECT 
                        ds.provider_id,
                        SUM(ds.available_amount) as total_available,
                        SUM(ds.earned_amount) as total_earned,
                        ROUND(
                            CASE 
                                WHEN SUM(ds.available_amount) > 0 
                                THEN (SUM(ds.earned_amount) / SUM(ds.available_amount) * 100)
                                ELSE 0 
                            END, 
                            1
                        ) as overall_capture_rate
                    FROM domain_scores ds
                    WHERE ds.provider_id = %s
                        AND ds.reporting_period = %s::DATE
                    GROUP BY ds.provider_id
                )
                SELECT 
                    p.id as provider_id,
                    p.provider_name,
                    p.region,
                    p.specialty,
                    o.organization_name,
                    c.contract_name,
                    c.payer_name,
                    %s::DATE as reporting_period,
                    TO_CHAR(%s::DATE - INTERVAL '11 months', 'MM/DD/YYYY') || ' - ' || 
                        TO_CHAR(%s::DATE, 'MM/DD/YYYY') as rolling_window_display,
                    COALESCE(ca.current_members, 0) as attributed_members_current,
                    COALESCE(ca.current_members, 0) - COALESCE(pa.prior_members, 0) as net_member_change,
                    ROUND(COALESCE(ca.avg_risk_score, 0), 2) as avg_risk_score_r12,
                    COALESCE(dp.total_available, 0) as total_available_pool,
                    COALESCE(dp.total_earned, 0) as total_earned,
                    COALESCE(dp.overall_capture_rate, 0) as overall_capture_rate
                FROM providers p
                INNER JOIN organizations o ON p.organization_id = o.id
                INNER JOIN contracts c ON c.organization_id = o.id
                LEFT JOIN current_attribution ca ON ca.provider_id = p.id
                LEFT JOIN prior_attribution pa ON pa.provider_id = p.id
                LEFT JOIN domain_performance dp ON dp.provider_id = p.id
                WHERE p.id = %s
                    AND p.active_flag = TRUE
                LIMIT 1
            """, (
                provider_id,  # current_attribution provider filter
                reporting_period,  # current_attribution month
                provider_id,  # prior_attribution provider filter
                reporting_period,  # prior_attribution month calc
                provider_id,  # domain_performance provider filter
                reporting_period,  # domain_performance period
                reporting_period,  # SELECT reporting_period
                reporting_period,  # rolling window start
                reporting_period,  # rolling window end
                provider_id  # final WHERE clause
            ))
            
            snapshot = cursor.fetchone()
            
            if not snapshot:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Provider {provider_id} not found or inactive"
                )
            
            return {
                "success": True,
                "data": snapshot
            }
    
    except HTTPException:
        raise
    except Exception as e:
        # Log the error internally but don't expose SQL details to client
        print(f"Database error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="Internal server error retrieving provider snapshot"
        )


@router.get("")
async def get_all_providers(
    user: dict = Depends(get_current_user),
    organization_id: Optional[int] = Query(
        default=None,
        description="Filter by organization ID (admin only)"
    ),
    active_only: bool = Query(
        default=True,
        description="Return only active providers"
    )
):
    """
    Get all providers with optional filtering
    
    Access Control:
    - Admins: Can see providers from any organization (use organization_id param)
    - Clients: Can only see providers from their organization (organization_id param ignored)
    
    Returns basic provider list for dropdown/selection
    """
    try:
        with get_db_cursor() as cursor:
            # Build query with proper parameterization
            query = """
                SELECT 
                    p.id,
                    p.provider_name,
                    p.provider_type,
                    p.specialty,
                    p.region,
                    o.organization_name,
                    o.id as organization_id
                FROM providers p
                INNER JOIN organizations o ON p.organization_id = o.id
                WHERE 1=1
            """
            
            params = []
            
            # Access control: client users can only see their own organization
            if user["role"] == "admin":
                # Admin can filter by organization_id parameter
                if organization_id is not None:
                    query += " AND p.organization_id = %s"
                    params.append(organization_id)
            else:
                # Client users are restricted to their own organization
                query += " AND p.organization_id = %s"
                params.append(user["organization_id"])
            
            if active_only:
                query += " AND p.active_flag = TRUE"
            
            query += " ORDER BY p.provider_name ASC"
            
            cursor.execute(query, tuple(params))
            providers = cursor.fetchall()
            
            return {
                "success": True,
                "data": providers,
                "count": len(providers)
            }
    
    except Exception as e:
        print(f"Database error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error retrieving providers"
        )


@router.get("/{provider_id}/domains")
async def get_provider_domain_breakdown(
    provider_id: int,
    user: dict = Depends(get_current_user),
    reporting_period: Optional[str] = Query(default="2025-12-31")
):
    """
    Get detailed domain performance breakdown for a provider
    
    Access Control:
    - Admins: Can access any provider
    - Clients: Can only access providers from their organization
    """
    try:
        # Validate date
        try:
            date.fromisoformat(reporting_period)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")
        
        with get_db_cursor() as cursor:
            # First check if provider exists and get its organization_id
            cursor.execute("""
                SELECT organization_id, active_flag 
                FROM providers 
                WHERE id = %s
            """, (provider_id,))
            
            provider_check = cursor.fetchone()
            
            if not provider_check:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Provider {provider_id} not found"
                )
            
            provider_org_id = provider_check['organization_id']
            provider_active = provider_check['active_flag']
            
            # Access control check for client users
            if user["role"] != "admin" and user["organization_id"] != provider_org_id:
                raise HTTPException(
                    status_code=403, 
                    detail="You do not have permission to access this provider"
                )
            
            if not provider_active:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Provider {provider_id} is inactive"
                )
            
            cursor.execute("""
                SELECT 
                    ds.id,
                    vd.domain_name,
                    vd.domain_weight,
                    ds.r12_score,
                    ds.benchmark_score,
                    ds.vs_benchmark,
                    ds.available_amount,
                    ds.earned_amount,
                    ds.missed_amount,
                    ds.capture_rate,
                    vd.sort_order
                FROM domain_scores ds
                INNER JOIN vbp_domains vd ON ds.domain_id = vd.id
                WHERE ds.provider_id = %s
                    AND ds.reporting_period = %s::DATE
                ORDER BY vd.sort_order ASC
            """, (provider_id, reporting_period))
            
            domains = cursor.fetchall()
            
            return {
                "success": True,
                "data": domains,
                "count": len(domains)
            }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
