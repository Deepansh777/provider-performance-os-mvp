import React from 'react';

const PerformanceCommandCenter = ({ snapshot }) => {
  return (
    <div className="page-container">

      {snapshot ? (
        <div className="snapshot-container">
          <div className="snapshot-metrics">
            <div className="metric-item">
              <div className="metric-label">Provider Name</div>
              <div className="metric-value">{snapshot.provider_name}</div>
            </div>

            <div className="metric-item">
              <div className="metric-label">Reporting Period</div>
              <div className="metric-value">{snapshot.rolling_window_display}</div>
            </div>

            <div className="metric-item">
              <div className="metric-label">Attributed Members (Current Month)</div>
              <div className="metric-value">{snapshot.attributed_members_current?.toLocaleString()}</div>
            </div>

            <div className="metric-item">
              <div className="metric-label">Net Member Change (vs Prior 12 Mo)</div>
              <div className="metric-value">
                <span className={snapshot.net_member_change >= 0 ? 'change-positive' : 'change-negative'}>
                  {snapshot.net_member_change > 0 ? '+' : ''}{snapshot.net_member_change}
                </span>
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-label">Avg Risk Score (R12)</div>
              <div className="metric-value">{snapshot.avg_risk_score_r12}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="content-section">
          <p>Select an organization to view performance data.</p>
        </div>
      )}

      <div className="content-section">
        <p>Executive dashboard showing overall performance metrics and KPIs.</p>
        {/* Add performance metrics, charts, and key indicators here */}
      </div>
    </div>
  );
};

export default PerformanceCommandCenter;
