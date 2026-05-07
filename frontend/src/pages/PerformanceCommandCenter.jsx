import React from 'react';
import VisualizationCard from '../components/VisualizationCard';
import EarningsWaterfallChart from '../components/EarningsWaterfallChart';

const PerformanceCommandCenter = ({ snapshot, domains, benchmarkMetrics }) => {
  // Format currency
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value) => {
    if (value === null || value === undefined) return '0%';
    return `${parseFloat(value).toFixed(1)}%`;
  };

  // Format number with appropriate precision
  const formatNumber = (value, unitType) => {
    if (value === null || value === undefined) return '0';

    if (unitType === 'PMPM' || unitType === '$') {
      return formatCurrency(value);
    } else if (unitType === '%') {
      return formatPercent(value);
    } else if (unitType === '/1000' || unitType === '/100') {
      return parseFloat(value).toFixed(1);
    } else if (unitType === 'score') {
      return parseFloat(value).toFixed(1);
    } else if (unitType === 'days') {
      return parseFloat(value).toFixed(1);
    }

    return parseFloat(value).toFixed(1);
  };

  // Determine performance status based on direction and percentile
  const getPerformanceStatus = (direction, percentile) => {
    if (!percentile) return 'neutral';

    // For "lower is better" metrics, invert the logic
    if (direction === 'lower_better') {
      if (percentile >= 70) return 'excellent';  // Top 30% (lower values are better)
      if (percentile >= 50) return 'good';
      if (percentile >= 30) return 'fair';
      return 'poor';
    } else {
      // For "higher is better" metrics
      if (percentile >= 70) return 'excellent';
      if (percentile >= 50) return 'good';
      if (percentile >= 30) return 'fair';
      return 'poor';
    }
  };

  // Calculate missed opportunity
  const calculateMissedOpportunity = () => {
    if (!snapshot) return 0;
    return (snapshot.total_available_pool || 0) - (snapshot.total_earned || 0);
  };

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

          {/* KPI Header Cards */}
          <div className="kpi-header-grid">
            <div className="kpi-card kpi-card-primary">
              <div className="kpi-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="kpi-content">
                <div className="kpi-label">Total Available Pool — R12</div>
                <div className="kpi-value">{formatCurrency(snapshot.total_available_pool)}</div>
              </div>
            </div>

            <div className="kpi-card kpi-card-success">
              <div className="kpi-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.76489 14.1003 1.98232 16.07 2.86" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="kpi-content">
                <div className="kpi-label">Total Earned — R12</div>
                <div className="kpi-value">{formatCurrency(snapshot.total_earned)}</div>
              </div>
            </div>

            <div className="kpi-card kpi-card-warning">
              <div className="kpi-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.29 3.86L1.82 18C1.64537 18.3024 1.55296 18.6453 1.55199 18.9945C1.55101 19.3437 1.64151 19.6871 1.81445 19.9905C1.98738 20.2939 2.23675 20.5467 2.53773 20.7239C2.83871 20.9011 3.18082 20.9962 3.53 21H20.47C20.8192 20.9962 21.1613 20.9011 21.4623 20.7239C21.7633 20.5467 22.0126 20.2939 22.1856 19.9905C22.3585 19.6871 22.449 19.3437 22.448 18.9945C22.447 18.6453 22.3546 18.3024 22.18 18L13.71 3.86C13.5317 3.56611 13.2807 3.32312 12.9812 3.15448C12.6817 2.98585 12.3437 2.89725 12 2.89725C11.6563 2.89725 11.3183 2.98585 11.0188 3.15448C10.7193 3.32312 10.4683 3.56611 10.29 3.86Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 9V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="kpi-content">
                <div className="kpi-label">Missed Opportunity — R12</div>
                <div className="kpi-value">{formatCurrency(calculateMissedOpportunity())}</div>
              </div>
            </div>

            <div className="kpi-card kpi-card-info">
              <div className="kpi-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="kpi-content">
                <div className="kpi-label">Overall Capture Rate — R12</div>
                <div className="kpi-value">{formatPercent(snapshot.overall_capture_rate)}</div>
              </div>
            </div>

            <div className="kpi-card kpi-card-accent">
              <div className="kpi-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="kpi-content">
                <div className="kpi-label">Attributed Members (Current Month)</div>
                <div className="kpi-value">{snapshot.attributed_members_current?.toLocaleString()}</div>
              </div>
            </div>

            <div className="kpi-card kpi-card-secondary">
              <div className="kpi-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="kpi-content">
                <div className="kpi-label">Avg Risk Score (R12)</div>
                <div className="kpi-value">{snapshot.avg_risk_score_r12}</div>
              </div>
            </div>
          </div>

          {/* Domain Performance Summary */}
          {domains && domains.length > 0 && (
            <VisualizationCard
              title="Domain Performance Summary"
              data={domains}
              csvFilename={`domain-performance-${snapshot.provider_name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}`}
              csvHeaders={['Domain', 'Weight (%)', 'R12 Score', 'Benchmark', 'vs Benchmark', 'Available ($)', 'Earned ($)', 'Missed ($)', 'Capture (%)']}
              csvMapper={(domain) => [
                domain.domain_name,
                domain.domain_weight,
                domain.r12_score,
                domain.benchmark_score,
                domain.vs_benchmark,
                domain.available_amount,
                domain.earned_amount,
                domain.missed_amount,
                domain.capture_rate.toFixed(1)
              ]}
            >
              <div className="domain-table-container">
                <table className="domain-table">
                  <thead>
                    <tr>
                      <th className="domain-name-col">Domain</th>
                      <th>Weight</th>
                      <th>R12 Score</th>
                      <th>Benchmark</th>
                      <th>vs Benchmark</th>
                      <th>Available ($)</th>
                      <th>Earned ($)</th>
                      <th>Missed ($)</th>
                      <th>Capture %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {domains.map((domain) => (
                      <tr key={domain.id} className="domain-row">
                        <td className="domain-name">
                          <div className="domain-name-wrapper">
                            <span className="domain-indicator" style={{
                              backgroundColor: domain.capture_rate >= 70 ? '#10b981' :
                                domain.capture_rate >= 50 ? '#f59e0b' : '#ef4444'
                            }}></span>
                            {domain.domain_name}
                          </div>
                        </td>
                        <td className="text-center">{domain.domain_weight}%</td>
                        <td className="text-center score-cell">
                          <span className={`score-badge ${domain.r12_score >= 90 ? 'score-excellent' :
                            domain.r12_score >= 75 ? 'score-good' :
                              domain.r12_score >= 60 ? 'score-fair' : 'score-poor'
                            }`}>
                            {domain.r12_score}
                          </span>
                        </td>
                        <td className="text-center">{domain.benchmark_score}</td>
                        <td className="text-center">
                          <span className={domain.vs_benchmark >= 0 ? 'change-positive' : 'change-negative'}>
                            {domain.vs_benchmark > 0 ? '+' : ''}{domain.vs_benchmark}
                          </span>
                        </td>
                        <td className="text-right">{formatCurrency(domain.available_amount)}</td>
                        <td className="text-right">
                          <span className="earned-value">{formatCurrency(domain.earned_amount)}</span>
                        </td>
                        <td className="text-right">
                          <span className="missed-value">{formatCurrency(domain.missed_amount)}</span>
                        </td>
                        <td className="text-center">
                          <div className="capture-rate-cell">
                            <span className={`capture-rate ${domain.capture_rate >= 70 ? 'rate-high' :
                              domain.capture_rate >= 50 ? 'rate-medium' : 'rate-low'
                              }`}>
                              {domain.capture_rate.toFixed(1)}%
                            </span>
                            <div className="capture-bar">
                              <div
                                className="capture-bar-fill"
                                style={{
                                  width: `${domain.capture_rate}%`,
                                  backgroundColor: domain.capture_rate >= 70 ? '#10b981' :
                                    domain.capture_rate >= 50 ? '#f59e0b' : '#ef4444'
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </VisualizationCard>
          )}

          {/* Split Row: Earnings Waterfall Chart + Performance vs Network */}
          {domains && domains.length > 0 && (
            <div style={{
              display: 'flex',
              gap: '24px',
              width: '100%'
            }}>
              {/* Earnings Waterfall Chart */}
              <div style={{ flex: '0 0 calc(50% - 12px)', minWidth: 0 }}>
                <VisualizationCard
                  title="Earnings Waterfall"
                  data={domains}
                  csvFilename={`earnings-waterfall-${snapshot.provider_name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}`}
                  csvHeaders={['Domain', 'Earned ($)', 'Missed ($)', 'Available ($)', 'Capture Rate (%)']}
                  csvMapper={(domain) => [
                    domain.domain_name,
                    domain.earned_amount,
                    domain.missed_amount,
                    domain.available_amount,
                    domain.capture_rate.toFixed(1)
                  ]}
                >
                  <EarningsWaterfallChart domains={domains} />
                </VisualizationCard>
              </div>

              {/* Performance vs Network Benchmark Table */}
              {benchmarkMetrics && benchmarkMetrics.length > 0 && (
                <div style={{ flex: '0 0 calc(50% - 12px)', minWidth: 0 }}>
                  <VisualizationCard
                    title="Performance vs Network"
                    data={benchmarkMetrics}
                    csvFilename={`performance-vs-network-${snapshot.provider_name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}`}
                    csvHeaders={['Metric', 'Your Value', 'Network Avg', 'Percentile', 'Status']}
                    csvMapper={(metric) => [
                      metric.metric_display_name,
                      formatNumber(metric.provider_value, metric.unit_type),
                      formatNumber(metric.network_avg, metric.unit_type),
                      metric.percentile,
                      metric.status
                    ]}
                  >
                    <div className="benchmark-comparison-table">
                      <table className="domain-table">
                        <thead>
                          <tr>
                            <th className="text-left">Metric</th>
                            <th className="text-right">Your Value</th>
                            <th className="text-right">Network Avg</th>
                            <th className="text-center">Percentile</th>
                          </tr>
                        </thead>
                        <tbody>
                          {benchmarkMetrics.map((metric, index) => {
                            const status = getPerformanceStatus(metric.direction, metric.percentile);
                            const statusColors = {
                              excellent: { bg: '#10b981', text: '#10b981' },
                              good: { bg: '#3b82f6', text: '#3b82f6' },
                              fair: { bg: '#f59e0b', text: '#f59e0b' },
                              poor: { bg: '#ef4444', text: '#ef4444' },
                              neutral: { bg: '#6b7280', text: '#6b7280' }
                            };
                            const colors = statusColors[status] || statusColors.neutral;

                            return (
                              <tr key={index} className="domain-row">
                                <td className="text-left" style={{ fontWeight: '500' }}>
                                  {metric.metric_display_name}
                                </td>
                                <td className="text-right">
                                  <span style={{
                                    color: '#1f2937',
                                    fontWeight: '600'
                                  }}>
                                    {formatNumber(metric.provider_value, metric.unit_type)}
                                  </span>
                                </td>
                                <td className="text-right" style={{ color: '#6b7280' }}>
                                  {formatNumber(metric.network_avg, metric.unit_type)}
                                </td>
                                <td className="text-center">
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <span style={{
                                      display: 'inline-block',
                                      padding: '0.375rem 0.75rem',
                                      borderRadius: '8px',
                                      fontWeight: '700',
                                      fontSize: '0.875rem',
                                      background: colors.bg,
                                      color: 'white'
                                    }}>
                                      {metric.percentile}th
                                    </span>
                                    <div className="capture-bar" style={{ width: '100%', maxWidth: '120px' }}>
                                      <div
                                        className="capture-bar-fill"
                                        style={{
                                          width: `${metric.percentile}%`,
                                          backgroundColor: colors.bg
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </VisualizationCard>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="content-section">
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 11L12 14L22 4" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3>No Organization Selected</h3>
            <p>Select an organization from the dropdown above to view performance data.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceCommandCenter;
