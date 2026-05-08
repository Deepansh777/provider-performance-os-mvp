import React, { useState, useEffect } from 'react';
import VisualizationCard from '../components/VisualizationCard';
import RiskPyramidChart from '../components/RiskPyramidChart';
import ChronicConditionBubbleChart from '../components/ChronicConditionBubbleChart';
import CostPMPMChart from '../components/CostPMPMChart';
import CMTargetsTable from '../components/CMTargetsTable';
import { providersAPI } from '../api';

const PopulationRiskIntelligence = ({ snapshot }) => {
  const [riskData, setRiskData] = useState([]);
  const [conditionData, setConditionData] = useState([]);
  const [costData, setCostData] = useState([]);
  const [cmTargets, setCmTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conditionLoading, setConditionLoading] = useState(false);
  const [costLoading, setCostLoading] = useState(false);
  const [cmLoading, setCmLoading] = useState(false);

  // Fetch risk stratification data when snapshot changes
  useEffect(() => {
    const fetchRiskData = async () => {
      if (!snapshot || !snapshot.provider_id) {
        setRiskData([]);
        return;
      }

      setLoading(true);
      try {
        const response = await providersAPI.getRiskStratification(
          snapshot.provider_id,
          snapshot.reporting_period || '2025-12-31'
        );

        if (response.data.success && response.data.data) {
          setRiskData(response.data.data);
        } else {
          setRiskData([]);
        }
      } catch (error) {
        console.error('Error fetching risk stratification data:', error);
        setRiskData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRiskData();
  }, [snapshot]);

  // Fetch chronic condition data when snapshot changes
  useEffect(() => {
    const fetchConditionData = async () => {
      if (!snapshot || !snapshot.provider_id) {
        setConditionData([]);
        return;
      }

      setConditionLoading(true);
      try {
        const response = await providersAPI.getChronicConditions(
          snapshot.provider_id,
          snapshot.reporting_period || '2025-12-31'
        );

        if (response.data.success && response.data.data) {
          setConditionData(response.data.data);
        } else {
          setConditionData([]);
        }
      } catch (error) {
        console.error('Error fetching chronic condition data:', error);
        setConditionData([]);
      } finally {
        setConditionLoading(false);
      }
    };

    fetchConditionData();
  }, [snapshot]);

  // Fetch cost summary data when snapshot changes
  useEffect(() => {
    const fetchCostData = async () => {
      if (!snapshot || !snapshot.provider_id) {
        setCostData([]);
        return;
      }

      setCostLoading(true);
      try {
        const response = await providersAPI.getCostSummary(
          snapshot.provider_id,
          snapshot.reporting_period || '2025-12-31'
        );

        if (response.data.success && response.data.data) {
          setCostData(response.data.data);
        } else {
          setCostData([]);
        }
      } catch (error) {
        console.error('Error fetching cost data:', error);
        setCostData([]);
      } finally {
        setCostLoading(false);
      }
    };

    fetchCostData();
  }, [snapshot]);

  // Fetch CM targets when snapshot changes
  useEffect(() => {
    const fetchCMTargets = async () => {
      if (!snapshot || !snapshot.provider_id) {
        setCmTargets([]);
        return;
      }

      setCmLoading(true);
      try {
        const response = await providersAPI.getCMTargets(
          snapshot.provider_id,
          snapshot.reporting_period || '2025-12-31'
        );

        if (response.data.success && response.data.data) {
          setCmTargets(response.data.data);
        } else {
          setCmTargets([]);
        }
      } catch (error) {
        console.error('Error fetching CM targets:', error);
        setCmTargets([]);
      } finally {
        setCmLoading(false);
      }
    };

    fetchCMTargets();
  }, [snapshot]);

  return (
    <div className="page-container">

      {snapshot ? (
        <>
          {/* Provider Context Bar */}
          <div className="provider-context-bar">
            <div className="context-item">
              <span className="context-label">Provider:</span>
              <span className="context-value">{snapshot.provider_name}</span>
            </div>
            <div className="context-item">
              <span className="context-label">Reporting Period:</span>
              <span className="context-value">{snapshot.rolling_window_display}</span>
            </div>
            <div className="context-item">
              <span className="context-label">Attributed Members (Current Month):</span>
              <span className="context-value">{snapshot.attributed_members_current?.toLocaleString()}</span>
            </div>
            <div className="context-item">
              <span className="context-label">Net Member Change (vs Prior 12 Mo):</span>
              <span className={`context-value ${snapshot.net_member_change >= 0 ? 'change-positive' : 'change-negative'}`}>
                {snapshot.net_member_change > 0 ? '+' : ''}{snapshot.net_member_change}
              </span>
            </div>
            <div className="context-item">
              <span className="context-label">Avg Risk Score (R12):</span>
              <span className="context-value">{snapshot.avg_risk_score_r12}</span>
            </div>
          </div>

          {/* Risk Stratification Visualization */}
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p>Loading risk stratification data...</p>
            </div>
          ) : riskData && riskData.length > 0 ? (
            <VisualizationCard
              title="Risk Stratification"
              titleVariant="#1e3a8a"
              data={riskData}
              csvFilename={`risk-stratification-${snapshot.provider_name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}`}
              csvHeaders={['Risk Tier', 'Members', '% of Panel', 'Avg Risk Score', 'Avg Cost PMPM ($)']}
              csvMapper={(tier) => [
                tier.risk_tier,
                tier.member_count,
                tier.pct_of_panel,
                tier.avg_risk_score,
                tier.avg_cost_pmpm
              ]}
            >
              <RiskPyramidChart riskData={riskData} />
            </VisualizationCard>
          ) : (
            <div className="content-section">
              <p>No risk stratification data available for this provider.</p>
            </div>
          )}

          {/* Two-Column Layout: Chronic Conditions and Cost Breakdown */}
          {(conditionLoading || costLoading) ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p>Loading data...</p>
            </div>
          ) : (conditionData && conditionData.length > 0) || (costData && costData.length > 0) ? (
            <div className="chart-row">
              {/* Chronic Condition Prevalence Visualization */}
              {conditionData && conditionData.length > 0 && (
                <VisualizationCard
                  title="Chronic Condition Prevalence"
                  titleVariant="#1e3a8a"
                  data={conditionData}
                  csvFilename={`chronic-conditions-${snapshot.provider_name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}`}
                  csvHeaders={['Condition', 'Members', 'Prevalence %', 'Controlled %', 'Uncontrolled %', 'Avg Cost PMPM ($)']}
                  csvMapper={(condition) => [
                    condition.condition_name,
                    condition.member_count,
                    condition.prevalence_pct,
                    condition.controlled_pct,
                    condition.uncontrolled_pct,
                    condition.avg_cost_pmpm
                  ]}
                >
                  <ChronicConditionBubbleChart conditionData={conditionData} />
                </VisualizationCard>
              )}

              {/* Cost PMPM Breakdown */}
              {costData && costData.length > 0 && (
                <VisualizationCard
                  title="Cost Breakdown by Category"
                  titleVariant="#1e3a8a"
                  data={costData}
                  csvFilename={`cost-summary-${snapshot.provider_name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}`}
                  csvHeaders={['Cost Category', 'Total Cost ($)', 'PMPM ($)', 'YoY Delta PMPM ($)', 'YoY Delta %', '% of Total']}
                  csvMapper={(cost) => [
                    cost.cost_category,
                    cost.total_cost,
                    cost.pmpm,
                    cost.yoy_delta_pmpm,
                    cost.yoy_delta_percent,
                    cost.percent_of_total_cost
                  ]}
                >
                  <CostPMPMChart costData={costData} />
                </VisualizationCard>
              )}
            </div>
          ) : null}

          {/* High-Priority CM Targets Table */}
          {cmLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p>Loading care management targets...</p>
            </div>
          ) : cmTargets && cmTargets.length > 0 ? (
            <VisualizationCard
              title="High-Priority CM Targets"
              titleVariant="#1e3a8a"
              data={cmTargets}
              csvFilename={`cm-targets-${snapshot.provider_name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}`}
              csvHeaders={['Member ID', 'Risk Tier', 'Admit Prob %', 'Primary Conditions', 'Last PCP Visit', 'TCM Enrolled', 'No PCP >12mo', 'Open Gaps', 'ER Utilizer', 'Post-Discharge', 'Urgency']}
              csvMapper={(target) => [
                target.member_external_id,
                target.risk_tier,
                target.predicted_admit_probability.toFixed(1),
                target.primary_conditions,
                target.last_pcp_visit || 'N/A',
                target.tcm_enrolled ? 'Yes' : 'No',
                target.no_pcp_visit_12mo ? 'Yes' : 'No',
                target.open_care_gaps > 0 ? 'Yes' : 'No',
                target.er_utilizer_flag ? 'Yes' : 'No',
                target.post_discharge_flag ? 'Yes' : 'No',
                target.urgency_level
              ]}
            >
              <CMTargetsTable targets={cmTargets} />
            </VisualizationCard>
          ) : null}
        </>
      ) : (
        <div className="content-section">
          <p>Select an organization to view population and risk data.</p>
        </div>
      )}
    </div>
  );
};

export default PopulationRiskIntelligence;
