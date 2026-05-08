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


@router.get("/{provider_id}/cost-summary")
async def get_provider_cost_summary(
    provider_id: int,
    user: dict = Depends(get_current_user),
    reporting_period: Optional[str] = Query(
        default="2025-12-31",
        description="Reporting period in YYYY-MM-DD format"
    )
):
    """
    Get cost summary breakdown by category for a provider
    
    Access Control:
    - Admins: Can access any provider
    - Clients: Can only access providers from their organization
    
    Returns cost categories with:
    - R12 PMPM values
    - YoY delta PMPM (dollar change)
    - YoY delta percent (percentage change)
    - Total cost
    - Percent of total cost
    """
    try:
        # Validate date format
        try:
            date.fromisoformat(reporting_period)
        except ValueError:
            raise HTTPException(
                status_code=400, 
                detail="Invalid date format. Use YYYY-MM-DD"
            )
        
        with get_db_cursor() as cursor:
            # Check provider exists and get organization_id
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
            
            # Access control check for client users
            if user["role"] != "admin" and user["organization_id"] != provider_org_id:
                raise HTTPException(
                    status_code=403, 
                    detail="You do not have permission to access this provider"
                )
            
            # Get cost summary data
            cursor.execute("""
                SELECT 
                    cost_category,
                    total_cost,
                    pmpm,
                    yoy_delta_pmpm,
                    yoy_delta_percent,
                    percent_of_total_cost,
                    measurement_window
                FROM cost_summary
                WHERE provider_id = %s
                    AND reporting_period = %s::DATE
                ORDER BY pmpm DESC
            """, (provider_id, reporting_period))
            
            cost_data = cursor.fetchall()
            
            if not cost_data:
                return {
                    "success": True,
                    "data": [],
                    "message": "No cost data available for this period"
                }
            
            return {
                "success": True,
                "data": cost_data
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


@router.get("/{provider_id}/benchmark-comparison")
async def get_provider_benchmark_comparison(
    provider_id: int,
    user: dict = Depends(get_current_user),
    reporting_period: Optional[str] = Query(default="2025-12-31")
):
    """
    Get benchmark comparison metrics for Performance vs Network visualization
    
    Returns key metrics with provider value, network average, and percentile
    
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
            
            # Query for benchmark comparison metrics
            cursor.execute("""
                SELECT 
                    md.metric_display_name,
                    md.unit_type,
                    md.direction,
                    pmr.metric_value as provider_value,
                    pmr.benchmark_value as network_avg,
                    pmr.percentile,
                    pmr.status
                FROM provider_metric_results pmr
                INNER JOIN metric_definitions md ON pmr.metric_definition_id = md.id
                WHERE pmr.provider_id = %s
                    AND pmr.reporting_period = %s::DATE
                    AND md.metric_name IN (
                        'total_cost_pmpm',
                        'admissions_per_1000',
                        'er_visits_per_1000',
                        'readmission_rate_30d',
                        'quality_score_r12',
                        'referral_rate_100_pcp'
                    )
                ORDER BY 
                    CASE md.metric_name
                        WHEN 'total_cost_pmpm' THEN 1
                        WHEN 'admissions_per_1000' THEN 2
                        WHEN 'er_visits_per_1000' THEN 3
                        WHEN 'readmission_rate_30d' THEN 4
                        WHEN 'quality_score_r12' THEN 5
                        WHEN 'referral_rate_100_pcp' THEN 6
                    END
            """, (provider_id, reporting_period))
            
            metrics = cursor.fetchall()
            
            return {
                "success": True,
                "data": metrics,
                "count": len(metrics)
            }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{provider_id}/risk-stratification")
async def get_provider_risk_stratification(
    provider_id: int,
    user: dict = Depends(get_current_user),
    reporting_period: Optional[str] = Query(default="2025-12-31")
):
    """
    Get risk stratification data for Population & Risk Intelligence visualization
    
    Returns member distribution across risk tiers with aggregated metrics:
    - High Risk (Score ≥2.25)
    - Rising Risk (Score 1.5-2.24)
    - Moderate Risk (Score 1.0-1.49)
    - Low Risk (Score <1.0)
    
    For each tier:
    - Member count
    - % of panel
    - Average risk score
    - Average cost PMPM
    
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
            
            # Query for risk stratification
            cursor.execute("""
                WITH attributed_members AS (
                    SELECT 
                        ma.member_id,
                        m.risk_score,
                        mrm.risk_tier,
                        mrm.avg_cost_pmpm
                    FROM member_attribution ma
                    INNER JOIN members m ON ma.member_id = m.id
                    INNER JOIN member_risk_monthly mrm ON mrm.member_id = m.id
                    WHERE ma.provider_id = %s
                        AND ma.attribution_month = DATE_TRUNC('month', %s::DATE)
                        AND ma.attribution_status = 'active'
                        AND mrm.reporting_month = DATE_TRUNC('month', %s::DATE)
                ),
                total_members AS (
                    SELECT COUNT(*) as total_count
                    FROM attributed_members
                )
                SELECT 
                    am.risk_tier,
                    COUNT(*) as member_count,
                    ROUND((COUNT(*) * 100.0 / tm.total_count), 1) as pct_of_panel,
                    ROUND(AVG(am.risk_score), 2) as avg_risk_score,
                    ROUND(AVG(am.avg_cost_pmpm), 2) as avg_cost_pmpm,
                    CASE am.risk_tier
                        WHEN 'High Risk' THEN 1
                        WHEN 'Rising Risk' THEN 2
                        WHEN 'Moderate Risk' THEN 3
                        WHEN 'Low Risk' THEN 4
                    END as sort_order
                FROM attributed_members am
                CROSS JOIN total_members tm
                GROUP BY am.risk_tier, tm.total_count
                ORDER BY sort_order ASC
            """, (provider_id, reporting_period, reporting_period))
            
            risk_tiers = cursor.fetchall()
            
            return {
                "success": True,
                "data": risk_tiers,
                "count": len(risk_tiers)
            }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{provider_id}/chronic-conditions")
async def get_provider_chronic_conditions(
    provider_id: int,
    user: dict = Depends(get_current_user),
    reporting_period: Optional[str] = Query(default="2025-12-31")
):
    """
    Get chronic condition prevalence and metrics for bubble chart visualization
    
    Returns for each condition:
    - Member count (bubble size)
    - Controlled % (X-axis)
    - Avg Cost PMPM (Y-axis)
    - Prevalence % (for context)
    - Uncontrolled % (for color coding)
    
    Conditions tracked:
    - Diabetes (Type 2)
    - Hypertension
    - CHF
    - COPD / Asthma
    - CKD
    
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
            
            # Query for chronic condition metrics
            cursor.execute("""
                WITH attributed_members AS (
                    -- Get all attributed members for the provider
                    SELECT 
                        ma.member_id,
                        m.risk_score,
                        mrm.avg_cost_pmpm
                    FROM member_attribution ma
                    INNER JOIN members m ON ma.member_id = m.id
                    LEFT JOIN member_risk_monthly mrm ON mrm.member_id = m.id
                    WHERE ma.provider_id = %s
                        AND ma.attribution_month = DATE_TRUNC('month', %s::DATE)
                        AND ma.attribution_status = 'active'
                        AND (mrm.reporting_month IS NULL OR mrm.reporting_month = DATE_TRUNC('month', %s::DATE))
                ),
                total_panel AS (
                    SELECT COUNT(*) as total_members
                    FROM attributed_members
                ),
                condition_metrics AS (
                    -- Aggregate by condition
                    SELECT 
                        mc.condition_name,
                        COUNT(DISTINCT mc.member_id) as member_count,
                        ROUND((COUNT(DISTINCT mc.member_id) * 100.0 / tp.total_members), 1) as prevalence_pct,
                        ROUND((COUNT(DISTINCT CASE WHEN mc.controlled_flag = TRUE THEN mc.member_id END) * 100.0 / 
                            NULLIF(COUNT(DISTINCT mc.member_id), 0)), 1) as controlled_pct,
                        ROUND((COUNT(DISTINCT CASE WHEN mc.controlled_flag = FALSE THEN mc.member_id END) * 100.0 / 
                            NULLIF(COUNT(DISTINCT mc.member_id), 0)), 1) as uncontrolled_pct,
                        ROUND(AVG(am.avg_cost_pmpm), 2) as avg_cost_pmpm
                    FROM member_conditions mc
                    INNER JOIN attributed_members am ON mc.member_id = am.member_id
                    CROSS JOIN total_panel tp
                    WHERE mc.active_flag = TRUE
                    GROUP BY mc.condition_name, tp.total_members
                )
                SELECT 
                    condition_name,
                    member_count,
                    prevalence_pct,
                    COALESCE(controlled_pct, 0) as controlled_pct,
                    COALESCE(uncontrolled_pct, 0) as uncontrolled_pct,
                    avg_cost_pmpm
                FROM condition_metrics
                ORDER BY member_count DESC
            """, (provider_id, reporting_period, reporting_period))
            
            conditions = cursor.fetchall()
            
            return {
                "success": True,
                "data": conditions,
                "count": len(conditions)
            }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{provider_id}/hospital-metrics")
async def get_provider_hospital_metrics(
    provider_id: int,
    user: dict = Depends(get_current_user),
    reporting_period: Optional[str] = Query(default="2025-12-31")
):
    """
    Get detailed hospital cost and utilization metrics for provider
    
    Returns comprehensive metrics table with:
    - R12 current value
    - Prior 12 month value
    - Year-over-year delta
    - Benchmark value
    - Variance vs benchmark
    - Performance status (Above/At/Below)
    - Trend direction (Improving/Worsening)
    
    Metrics are grouped by category:
    - UTILIZATION: Admissions, readmissions, ER visits, avoidable ER
    - COST: Average cost per admission, total inpatient cost PMPM
    - POST-ACUTE & QUALITY: Observation stays, SNF/post-acute cost, hospital cost score
    
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
            # Access control check
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
            
            # Access control for client users
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
            
            # Query hospital metrics with full details
            cursor.execute("""
                WITH metric_data AS (
                    SELECT 
                        md.metric_name,
                        md.metric_display_name,
                        md.metric_category,
                        md.unit_type,
                        md.direction,
                        pmr.metric_value as r12_value,
                        pmr.prior_period_value as prior_12_value,
                        pmr.benchmark_value,
                        pmr.vs_benchmark,
                        pmr.status,
                        pmr.percentile,
                        -- Calculate YoY delta
                        CASE 
                            WHEN pmr.prior_period_value IS NOT NULL AND pmr.prior_period_value != 0
                            THEN ROUND(pmr.metric_value - pmr.prior_period_value, 2)
                            ELSE NULL
                        END as yoy_delta,
                        -- Determine trend direction
                        CASE 
                            WHEN pmr.prior_period_value IS NULL THEN 'stable'
                            WHEN md.direction = 'lower_better' AND pmr.metric_value < pmr.prior_period_value THEN 'improving'
                            WHEN md.direction = 'lower_better' AND pmr.metric_value > pmr.prior_period_value THEN 'worsening'
                            WHEN md.direction = 'higher_better' AND pmr.metric_value > pmr.prior_period_value THEN 'improving'
                            WHEN md.direction = 'higher_better' AND pmr.metric_value < pmr.prior_period_value THEN 'worsening'
                            ELSE 'stable'
                        END as trend
                    FROM provider_metric_results pmr
                    INNER JOIN metric_definitions md ON pmr.metric_definition_id = md.id
                    WHERE pmr.provider_id = %s
                        AND pmr.reporting_period = %s::DATE
                        AND md.domain_name IN ('Hospital Costs', 'Executive')
                        AND md.metric_name IN (
                            'admissions_per_1000',
                            'readmission_rate_30d',
                            'er_visits_per_1000',
                            'avoidable_er_rate',
                            'observation_stays_per_1000',
                            'avg_cost_per_admission',
                            'total_inpatient_cost_pmpm',
                            'snf_post_acute_cost_pmpm',
                            'hospital_cost_score'
                        )
                )
                SELECT 
                    metric_name,
                    metric_display_name,
                    metric_category,
                    unit_type,
                    direction,
                    r12_value,
                    prior_12_value,
                    yoy_delta,
                    benchmark_value,
                    vs_benchmark,
                    status,
                    percentile,
                    trend
                FROM metric_data
                ORDER BY 
                    CASE metric_category
                        WHEN 'utilization' THEN 1
                        WHEN 'cost' THEN 2
                        WHEN 'score' THEN 3
                        ELSE 4
                    END,
                    CASE metric_name
                        WHEN 'admissions_per_1000' THEN 1
                        WHEN 'readmission_rate_30d' THEN 2
                        WHEN 'er_visits_per_1000' THEN 3
                        WHEN 'avoidable_er_rate' THEN 4
                        WHEN 'avg_cost_per_admission' THEN 5
                        WHEN 'total_inpatient_cost_pmpm' THEN 6
                        WHEN 'observation_stays_per_1000' THEN 7
                        WHEN 'snf_post_acute_cost_pmpm' THEN 8
                        WHEN 'hospital_cost_score' THEN 9
                        ELSE 10
                    END
            """, (provider_id, reporting_period))
            
            metrics = cursor.fetchall()
            
            return {
                "success": True,
                "data": metrics,
                "count": len(metrics)
            }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{provider_id}/hospital-metrics-monthly")
async def get_provider_hospital_metrics_monthly(
    provider_id: int,
    user: dict = Depends(get_current_user),
    months: Optional[int] = Query(default=12, description="Number of months to fetch")
):
    """
    Get monthly time-series data for hospital metrics
    
    Returns monthly values for the last N months for all 9 hospital metrics:
    - Utilization metrics: admissions_per_1000, er_visits_per_1000, readmission_rate_30d, 
      avoidable_er_rate, observation_stays_per_1000
    - Cost metrics: avg_cost_per_admission, total_inpatient_cost_pmpm, snf_post_acute_cost_pmpm
    - Score metric: hospital_cost_score
    
    Access Control:
    - Admins: Can access any provider
    - Clients: Can only access providers from their organization
    """
    try:
        with get_db_cursor() as cursor:
            # Access control check
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
            
            # Access control for client users
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
            
            # Query monthly time-series data
            cursor.execute("""
                SELECT 
                    md.metric_name,
                    md.metric_display_name,
                    md.unit_type,
                    pmr.reporting_period,
                    pmr.metric_value,
                    pmr.benchmark_value
                FROM provider_metric_results pmr
                INNER JOIN metric_definitions md ON pmr.metric_definition_id = md.id
                WHERE pmr.provider_id = %s
                    AND pmr.measurement_window = 'monthly'
                    AND md.metric_name IN (
                        'admissions_per_1000',
                        'readmission_rate_30d',
                        'er_visits_per_1000',
                        'avoidable_er_rate',
                        'observation_stays_per_1000',
                        'avg_cost_per_admission',
                        'total_inpatient_cost_pmpm',
                        'snf_post_acute_cost_pmpm',
                        'hospital_cost_score'
                    )
                    AND pmr.reporting_period >= (
                        SELECT MAX(reporting_period) - INTERVAL '%s months'
                        FROM provider_metric_results
                        WHERE provider_id = %s AND measurement_window = 'monthly'
                    )
                ORDER BY pmr.reporting_period, md.metric_name
            """, (provider_id, months, provider_id))
            
            rows = cursor.fetchall()
            
            # Transform data into a more convenient structure for charting
            # Group by metric_name
            metrics_data = {}
            for row in rows:
                metric_name = row['metric_name']
                if metric_name not in metrics_data:
                    metrics_data[metric_name] = {
                        'metric_name': metric_name,
                        'metric_display_name': row['metric_display_name'],
                        'unit_type': row['unit_type'],
                        'data': []
                    }
                
                metrics_data[metric_name]['data'].append({
                    'reporting_period': row['reporting_period'].isoformat(),
                    'metric_value': float(row['metric_value']) if row['metric_value'] else None,
                    'benchmark_value': float(row['benchmark_value']) if row['benchmark_value'] else None
                })
            
            return {
                "success": True,
                "data": list(metrics_data.values()),
                "count": len(metrics_data)
            }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
