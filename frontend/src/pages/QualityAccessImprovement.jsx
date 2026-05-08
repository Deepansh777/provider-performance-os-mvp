import React from 'react';

const QualityAccessImprovement = ({ snapshot }) => {
  return (
    <div className="page-container">
      {/* Under Development Banner */}
      <div style={{
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '4px',
        padding: '16px 20px',
        margin: '20px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span style={{ fontSize: '24px' }}>🚧</span>
        <div>
          <strong style={{ color: '#856404', fontSize: '16px' }}>This Tab is Under Development</strong>
          <p style={{ margin: '4px 0 0 0', color: '#856404' }}>
            We're working hard to bring you quality metrics and access insights. Please check back later!
          </p>
        </div>
      </div>

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
            <p>Quality measures, HEDIS scores, and access metrics.</p>
            {/* Add quality metrics, care gaps, and access indicators here */}
          </div>
        </>
      ) : (
        <div className="content-section">
          <p>Select an organization to view quality and access data.</p>
        </div>
      )}
    </div>
  );
};

export default QualityAccessImprovement;
