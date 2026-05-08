import React from 'react';
import './CMTargetsTable.css';

const CMTargetsTable = ({ targets }) => {
  if (!targets || targets.length === 0) {
    return <div className="cm-targets-empty">No high-priority targets identified</div>;
  }

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  // Get urgency badge class
  const getUrgencyClass = (urgency) => {
    switch (urgency) {
      case 'Urgent': return 'urgency-urgent';
      case 'High': return 'urgency-high';
      case 'Medium': return 'urgency-medium';
      default: return 'urgency-low';
    }
  };

  // Get risk tier class
  const getRiskClass = (tier) => {
    switch (tier) {
      case 'High Risk': return 'risk-high';
      case 'Rising Risk': return 'risk-rising';
      case 'Moderate Risk': return 'risk-moderate';
      default: return 'risk-low';
    }
  };

  return (
    <div className="cm-targets-container">
      <div className="cm-targets-header">
        <h3>HIGH-PRIORITY CM TARGETS — Members with Predicted Admission Probability ≥ 30%</h3>
        <p className="cm-targets-subtitle">
          Members below are the highest-priority outreach targets based on projected admission probability. 
          Data sourced from predictive model code in claims data. Outreach within 30 days recommended for all ≥50%; within 7 days for ≥50%.
        </p>
      </div>

      <div className="cm-targets-table-wrapper">
        <table className="cm-targets-table">
          <thead>
            <tr>
              <th>Member ID</th>
              <th>Risk Tier</th>
              <th>Predicted Admit Prob %</th>
              <th>Primary Condition(s)</th>
              <th>Last PCP Visit</th>
              <th>TCM Enrolled?</th>
              <th>No PCP Visit &gt;12 Mo?</th>
              <th>Open Care Gaps?</th>
              <th>ER Utilizer (12+ visits)?</th>
              <th>Post-Discharge?</th>
              <th>Admit Prob Urgency</th>
            </tr>
          </thead>
          <tbody>
            {targets.map((target, index) => (
              <tr key={index} className="cm-target-row">
                <td className="member-id">{target.member_external_id}</td>
                <td>
                  <span className={`badge ${getRiskClass(target.risk_tier)}`}>
                    {target.risk_tier}
                  </span>
                </td>
                <td className="admit-prob">{target.predicted_admit_probability.toFixed(1)}%</td>
                <td className="conditions">{target.primary_conditions}</td>
                <td>{formatDate(target.last_pcp_visit)}</td>
                <td className="text-center">
                  <span className={target.tcm_enrolled ? 'status-yes' : 'status-no'}>
                    {target.tcm_enrolled ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="text-center">
                  <span className={target.no_pcp_visit_12mo ? 'status-yes' : 'status-no'}>
                    {target.no_pcp_visit_12mo ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="text-center">
                  <span className={target.open_care_gaps > 0 ? 'status-yes' : 'status-no'}>
                    {target.open_care_gaps > 0 ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="text-center">
                  <span className={target.er_utilizer_flag ? 'status-yes' : 'status-no'}>
                    {target.er_utilizer_flag ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="text-center">
                  <span className={target.post_discharge_flag ? 'status-yes' : 'status-no'}>
                    {target.post_discharge_flag ? 'Yes' : 'No'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${getUrgencyClass(target.urgency_level)}`}>
                    {target.urgency_level}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cm-targets-footer">
        <div className="legend">
          <span className="legend-item">
            <span className="legend-icon urgent"></span> ≥50% admit prob = Urgent
          </span>
          <span className="legend-item">
            <span className="legend-icon high"></span> 40–49% = High
          </span>
          <span className="legend-item">
            <span className="legend-icon medium"></span> 30–39% = Medium
          </span>
          <span className="legend-note">
            All flags derived from claims data — no manual input required
          </span>
        </div>
      </div>
    </div>
  );
};

export default CMTargetsTable;
