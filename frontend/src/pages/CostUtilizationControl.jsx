import React, { useState, useEffect } from 'react';
import VisualizationCard from '../components/VisualizationCard';
import HospitalMetricsTable from '../components/HospitalMetricsTable';
import { providersAPI } from '../api';

const CostUtilizationControl = ({ snapshot }) => {
  const [hospitalMetrics, setHospitalMetrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHospitalMetrics = async () => {
      if (!snapshot?.provider_id) {
        setHospitalMetrics([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await providersAPI.getHospitalMetrics(
          snapshot.provider_id,
          snapshot.reporting_period || '2025-12-31'
        );

        if (response.data.success) {
          setHospitalMetrics(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching hospital metrics:', err);
        setError('Failed to load hospital metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchHospitalMetrics();
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

          <VisualizationCard
            title="Hospital Cost & Utilization Metrics — R12"
            data={hospitalMetrics}
            csvFilename="hospital-metrics"
            csvHeaders={['Metric', 'R12 Value', 'Prior 12', 'YoY Delta', 'Benchmark', 'vs Benchmark', 'Performance', 'Trend']}
            csvMapper={(m) => [
              m.metric_display_name,
              m.r12_value,
              m.prior_12_value,
              m.yoy_delta,
              m.benchmark_value,
              m.vs_benchmark,
              m.status,
              m.trend
            ]}
          >
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                Loading hospital metrics...
              </div>
            ) : error ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
                {error}
              </div>
            ) : (
              <HospitalMetricsTable metrics={hospitalMetrics} />
            )}
          </VisualizationCard>
        </>
      ) : (
        <div className="content-section">
          <p>Select an organization to view cost and utilization data.</p>
        </div>
      )}
    </div>
  );
};

export default CostUtilizationControl;
