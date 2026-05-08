import React from 'react';

const BenchmarksTrustCenter = ({ snapshot }) => {
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

          <div className="content-section">
            <p>Comparative benchmarks, peer comparisons, and data transparency.</p>
            {/* Add benchmark comparisons, peer analytics, and data sources here */}
          </div>
        </>
      ) : (
        <div className="content-section">
          <p>Select an organization to view benchmark data.</p>
        </div>
      )}
    </div>
  );
};

export default BenchmarksTrustCenter;
