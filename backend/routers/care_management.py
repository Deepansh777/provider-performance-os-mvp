"""
Care Management Targets API Router
Provides high-priority member outreach targets based on risk and gaps
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
from datetime import date
from database import get_db_cursor
from auth import get_current_user

router = APIRouter(prefix="/api/providers", tags=["care-management"])


@router.get("/{provider_id}/cm-targets")
async def get_care_management_targets(
    provider_id: int,
    user: dict = Depends(get_current_user),
    reporting_period: Optional[str] = Query(
        default="2025-12-31",
        description="Reporting period in YYYY-MM-DD format"
    )
):
    """
    Get high-priority care management targets
    
    Returns members with:
    - High predicted admission probability (≥30%)
    - Risk stratification
    - Care gaps status
    - Recent utilization patterns
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
            
            # Access control check
            if user["role"] != "admin" and user["organization_id"] != provider_org_id:
                raise HTTPException(
                    status_code=403, 
                    detail="You do not have permission to access this provider"
                )
            
            # Get high-priority CM targets
            cursor.execute("""
                WITH member_conditions_agg AS (
                    SELECT 
                        mc.member_id,
                        STRING_AGG(DISTINCT mc.condition_name, ', ' ORDER BY mc.condition_name) as conditions,
                        COUNT(*) as condition_count
                    FROM member_conditions mc
                    WHERE mc.active_flag = TRUE
                    GROUP BY mc.member_id
                ),
                member_gaps AS (
                    SELECT 
                        cg.member_id,
                        COUNT(*) as open_gaps
                    FROM care_gaps cg
                    WHERE cg.gap_status = 'open' 
                        AND cg.provider_id = %s
                    GROUP BY cg.member_id
                ),
                recent_pcp_visit AS (
                    SELECT 
                        ae.member_id,
                        MAX(ae.event_date) as last_pcp_visit
                    FROM access_events ae
                    WHERE ae.provider_id = %s
                        AND ae.event_type IN ('PCP Visit', 'AWV', 'Preventive Visit')
                    GROUP BY ae.member_id
                ),
                recent_hospitalizations AS (
                    SELECT 
                        he.member_id,
                        MAX(he.discharge_date) as last_discharge_date,
                        BOOL_OR(he.readmission_flag) as has_readmission
                    FROM hospital_events he
                    WHERE he.provider_id = %s
                        AND he.event_type = 'inpatient'
                        AND he.discharge_date >= %s::DATE - INTERVAL '30 days'
                    GROUP BY he.member_id
                ),
                er_utilization AS (
                    SELECT 
                        he.member_id,
                        COUNT(*) as er_visits_r12
                    FROM hospital_events he
                    WHERE he.provider_id = %s
                        AND he.event_type = 'ER'
                        AND he.admit_date >= %s::DATE - INTERVAL '12 months'
                    GROUP BY he.member_id
                )
                SELECT 
                    m.id as member_id,
                    m.member_external_id,
                    m.member_name,
                    mrm.risk_tier,
                    mrm.predicted_admit_probability,
                    COALESCE(mca.conditions, 'None documented') as primary_conditions,
                    rpv.last_pcp_visit,
                    CASE 
                        WHEN rpv.last_pcp_visit IS NULL THEN TRUE
                        WHEN rpv.last_pcp_visit < %s::DATE - INTERVAL '12 months' THEN TRUE
                        ELSE FALSE 
                    END as no_pcp_visit_12mo,
                    COALESCE(mg.open_gaps, 0) as open_care_gaps,
                    COALESCE(eu.er_visits_r12, 0) >= 12 as er_utilizer_flag,
                    rh.last_discharge_date,
                    CASE 
                        WHEN rh.last_discharge_date IS NOT NULL THEN TRUE
                        ELSE FALSE
                    END as post_discharge_flag,
                    rh.has_readmission,
                    mrm.care_management_recommended_flag as tcm_enrolled,
                    CASE 
                        WHEN mrm.predicted_admit_probability >= 50 THEN 'Urgent'
                        WHEN mrm.predicted_admit_probability >= 40 THEN 'High'
                        WHEN mrm.predicted_admit_probability >= 30 THEN 'Medium'
                        ELSE 'Low'
                    END as urgency_level
                FROM members m
                INNER JOIN member_attribution ma ON ma.member_id = m.id
                INNER JOIN member_risk_monthly mrm ON mrm.member_id = m.id
                LEFT JOIN member_conditions_agg mca ON mca.member_id = m.id
                LEFT JOIN member_gaps mg ON mg.member_id = m.id
                LEFT JOIN recent_pcp_visit rpv ON rpv.member_id = m.id
                LEFT JOIN recent_hospitalizations rh ON rh.member_id = m.id
                LEFT JOIN er_utilization eu ON eu.member_id = m.id
                WHERE ma.provider_id = %s
                    AND ma.attribution_status = 'active'
                    AND ma.attribution_month = DATE_TRUNC('month', %s::DATE)
                    AND mrm.reporting_month = DATE_TRUNC('month', %s::DATE)
                    AND mrm.predicted_admit_probability >= 30
                ORDER BY mrm.predicted_admit_probability DESC, mrm.risk_score DESC
                LIMIT 50
            """, (
                provider_id,  # member_gaps
                provider_id,  # recent_pcp_visit
                provider_id,  # recent_hospitalizations
                reporting_period,  # recent_hospitalizations date filter
                provider_id,  # er_utilization
                reporting_period,  # er_utilization date filter
                reporting_period,  # no_pcp_visit_12mo check
                provider_id,  # main WHERE
                reporting_period,  # attribution_month
                reporting_period   # mrm.reporting_month
            ))
            
            targets = cursor.fetchall()
            
            return {
                "success": True,
                "data": targets,
                "count": len(targets)
            }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Database error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="Internal server error retrieving CM targets"
        )
