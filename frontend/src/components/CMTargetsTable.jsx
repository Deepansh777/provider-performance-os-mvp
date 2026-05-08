import React, { useState, useMemo } from 'react';
import './CMTargetsTable.css';

const CMTargetsTable = ({ targets }) => {
  const [sortField, setSortField] = useState('predicted_admit_probability');
  const [sortDirection, setSortDirection] = useState('desc');

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

  // Handle column sorting
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending for numeric fields, ascending for text
      setSortField(field);
      setSortDirection(['predicted_admit_probability', 'open_care_gaps'].includes(field) ? 'desc' : 'asc');
    }
  };

  // Sort targets based on current sort field and direction
  const sortedTargets = useMemo(() => {
    if (!targets || targets.length === 0) return [];
    const sorted = [...targets].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle date fields
      if (sortField === 'last_pcp_visit') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }

      // Handle boolean fields
      if (typeof aVal === 'boolean') {
        aVal = aVal ? 1 : 0;
        bVal = bVal ? 1 : 0;
      }

      // Handle null/undefined
      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      // Compare
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [targets, sortField, sortDirection]);

  // Get sort indicator
  const getSortIndicator = (field) => {
    if (sortField !== field) return ' ↕';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  // Check if targets is empty after all hooks are called
  if (!targets || targets.length === 0) {
    return <div className="cm-targets-empty">No high-priority targets identified</div>;
  }

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
              <th onClick={() => handleSort('member_external_id')} style={{ cursor: 'pointer' }}>
                Member ID{getSortIndicator('member_external_id')}
              </th>
              <th onClick={() => handleSort('risk_tier')} style={{ cursor: 'pointer' }}>
                Risk Tier{getSortIndicator('risk_tier')}
              </th>
              <th onClick={() => handleSort('predicted_admit_probability')} style={{ cursor: 'pointer' }}>
                Predicted Admit Prob %{getSortIndicator('predicted_admit_probability')}
              </th>
              <th onClick={() => handleSort('primary_conditions')} style={{ cursor: 'pointer' }}>
                Primary Condition(s){getSortIndicator('primary_conditions')}
              </th>
              <th onClick={() => handleSort('last_pcp_visit')} style={{ cursor: 'pointer' }}>
                Last PCP Visit{getSortIndicator('last_pcp_visit')}
              </th>
              <th onClick={() => handleSort('tcm_enrolled')} style={{ cursor: 'pointer' }}>
                TCM Enrolled?{getSortIndicator('tcm_enrolled')}
              </th>
              <th onClick={() => handleSort('no_pcp_visit_12mo')} style={{ cursor: 'pointer' }}>
                No PCP Visit &gt;12 Mo?{getSortIndicator('no_pcp_visit_12mo')}
              </th>
              <th onClick={() => handleSort('open_care_gaps')} style={{ cursor: 'pointer' }}>
                Open Care Gaps?{getSortIndicator('open_care_gaps')}
              </th>
              <th onClick={() => handleSort('er_utilizer_flag')} style={{ cursor: 'pointer' }}>
                ER Utilizer (12+ visits)?{getSortIndicator('er_utilizer_flag')}
              </th>
              <th onClick={() => handleSort('post_discharge_flag')} style={{ cursor: 'pointer' }}>
                Post-Discharge?{getSortIndicator('post_discharge_flag')}
              </th>
              <th onClick={() => handleSort('urgency_level')} style={{ cursor: 'pointer' }}>
                Admit Prob Urgency{getSortIndicator('urgency_level')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTargets.map((target, index) => (
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
