import React from 'react';
import './CostPMPMChart.css';

const CostPMPMChart = ({ costData }) => {
  if (!costData || costData.length === 0) {
    return <div className="cost-pmpm-chart-empty">No cost data available</div>;
  }

  // Find max PMPM for scaling
  const maxPMPM = Math.max(...costData.map(item => item.pmpm));

  // Format percentage with + or - sign
  const formatPercent = (value) => {
    if (value === null || value === undefined) return 'N/A';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  // Format currency
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '$0.00';
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="cost-pmpm-chart">
      <div className="chart-header">
        <h3>PMPM by Category — R12</h3>
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
            <span>Cost Increase</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
            <span>Cost Decrease</span>
          </div>
        </div>
      </div>
      
      <div className="chart-body">
        {costData.map((item, index) => {
          const barWidth = (item.pmpm / maxPMPM) * 100;
          const isNegativeChange = item.yoy_delta_percent < 0;
          const isNeutral = item.yoy_delta_percent === 0 || item.yoy_delta_percent === null;
          const barClass = isNeutral ? 'bar-neutral' : (isNegativeChange ? 'bar-decrease' : 'bar-increase');
          
          return (
            <div key={index} className="cost-row">
              <div className="category-label">
                {item.cost_category}
              </div>
              
              <div className="bar-container">
                <div 
                  className={`bar ${barClass}`}
                  style={{ width: `${barWidth}%` }}
                  title={`${item.cost_category}: ${formatCurrency(item.pmpm)}`}
                >
                  <span className="bar-value">{formatCurrency(item.pmpm)}</span>
                </div>
              </div>
              
              <div className={`change-value ${isNegativeChange ? 'negative' : 'positive'}`}>
                {formatPercent(item.yoy_delta_percent)}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="chart-footer">
        <p className="chart-note">
          Rolling 12-month PMPM cost per attributed member. YoY % change compares to prior 12-month period.
        </p>
      </div>
    </div>
  );
};

export default CostPMPMChart;
