import React, { useState, useMemo } from 'react';
import { Autocomplete, TextField, Chip } from '@mui/material';
import VisualizationCard from '../components/VisualizationCard';
import '../styles/BenchmarksTrustCenter.css';

const BenchmarkMetric = ({
  name,
  networkAvg,
  percentile25,
  median,
  percentile75,
  topDecile,
  direction,
  unit = ''
}) => {
  // Calculate positions as percentages for visualization
  const min = Math.min(percentile25, networkAvg, median, percentile75, topDecile);
  const max = Math.max(percentile25, networkAvg, median, percentile75, topDecile);
  const range = max - min;
  const padding = range * 0.1; // 10% padding on each side

  const getPosition = (value) => {
    return ((value - min + padding) / (range + 2 * padding)) * 100;
  };

  const pos25 = getPosition(percentile25);
  const pos50 = getPosition(median);
  const pos75 = getPosition(percentile75);
  const posAvg = getPosition(networkAvg);
  const posTopDecile = getPosition(topDecile);

  return (
    <div className="benchmark-metric">
      <div className="metric-row">
        <span className="metric-name">{name}</span>

        <div className="metric-visualization">
          {/* 25th-75th percentile band */}
          <div
            className="percentile-band"
            style={{
              left: `${pos25}%`,
              width: `${pos75 - pos25}%`
            }}
          />

          {/* Median line */}
          <div
            className="median-marker"
            style={{ left: `${pos50}%` }}
          >
            <div className="median-line" />
          </div>

          {/* Network average marker */}
          <div
            className="avg-marker"
            style={{ left: `${posAvg}%` }}
          >
            <div className="avg-circle" />
          </div>

          {/* Top decile marker */}
          <div
            className="decile-marker"
            style={{ left: `${posTopDecile}%` }}
          >
            <div className="decile-circle" />
          </div>
        </div>

        <div className="metric-values">
          <span className="value-item">
            <span className="value-label">25th</span>
            <span className="value-number">{percentile25}{unit}</span>
          </span>
          <span className="value-item highlight">
            <span className="value-label">Net avg</span>
            <span className="value-number">{networkAvg}{unit}</span>
          </span>
          <span className="value-item">
            <span className="value-label">Median</span>
            <span className="value-number">{median}{unit}</span>
          </span>
          <span className="value-item">
            <span className="value-label">75th</span>
            <span className="value-number">{percentile75}{unit}</span>
          </span>
          <span className="value-item">
            <span className="value-label">Top decile</span>
            <span className="value-number">{topDecile}{unit}</span>
          </span>
          <span className={`direction-badge ${direction.toLowerCase()}`}>
            {direction === 'Lower' ? '↓' : '↑'} {direction.toLowerCase()} better
          </span>
        </div>
      </div>
    </div>
  );
};

const BenchmarksTrustCenter = ({ snapshot }) => {
  const [selectedCategories, setSelectedCategories] = useState(['Utilization & Cost', 'Quality & Access']);

  const allMetrics = useMemo(() => [
    {
      category: 'Utilization & Cost',
      metrics: [
        {
          name: 'Admissions /1,000',
          networkAvg: 230,
          percentile25: 195,
          median: 225,
          percentile75: 255,
          topDecile: 280,
          direction: 'Lower'
        },
        {
          name: 'ER Visits /1,000',
          networkAvg: 290,
          percentile25: 240,
          median: 278,
          percentile75: 318,
          topDecile: 354,
          direction: 'Lower'
        },
        {
          name: '30-Day Readmission Rate (%)',
          networkAvg: 0.135,
          percentile25: 0.1,
          median: 0.128,
          percentile75: 0.158,
          topDecile: 0.184,
          direction: 'Lower'
        },
        {
          name: 'Total Cost PMPM ($)',
          networkAvg: 520,
          percentile25: 462,
          median: 510,
          percentile75: 568,
          topDecile: 624,
          direction: 'Lower'
        },
        {
          name: 'Inpatient Cost PMPM ($)',
          networkAvg: 88.5,
          percentile25: 74.2,
          median: 86.4,
          percentile75: 102.8,
          topDecile: 118.6,
          direction: 'Lower'
        },
        {
          name: 'Referral Cost PMPM ($)',
          networkAvg: 102,
          percentile25: 86.4,
          median: 98.2,
          percentile75: 116.4,
          topDecile: 134.2,
          direction: 'Lower'
        }
      ]
    },
    {
      category: 'Quality & Access',
      metrics: [
        {
          name: 'Quality Score (composite)',
          networkAvg: 76,
          percentile25: 68,
          median: 75,
          percentile75: 83,
          topDecile: 90,
          direction: 'Higher'
        },
        {
          name: 'Risk-Adjusted Cost Index',
          networkAvg: 1,
          percentile25: 0.82,
          median: 0.98,
          percentile75: 1.14,
          topDecile: 1.28,
          direction: 'Lower'
        },
        {
          name: 'Access Score',
          networkAvg: 75,
          percentile25: 64,
          median: 74,
          percentile75: 82,
          topDecile: 89,
          direction: 'Higher'
        },
        {
          name: 'Referral Rate /100 PCP',
          networkAvg: 24,
          percentile25: 18,
          median: 23.2,
          percentile75: 28.4,
          topDecile: 33.8,
          direction: 'Lower'
        },
        {
          name: 'AWV Completion Rate (%)',
          networkAvg: 0.68,
          percentile25: 0.62,
          median: 0.672,
          percentile75: 0.724,
          topDecile: 0.762,
          direction: 'Higher'
        },
        {
          name: 'OON Referral Rate (%)',
          networkAvg: 0.2,
          percentile25: 0.14,
          median: 0.192,
          percentile75: 0.248,
          topDecile: 0.294,
          direction: 'Lower'
        }
      ]
    }
  ], []);

  const categoryOptions = useMemo(() =>
    allMetrics.map(item => item.category),
    [allMetrics]);

  const filteredMetrics = useMemo(() =>
    allMetrics.filter(item => selectedCategories.includes(item.category)),
    [allMetrics, selectedCategories]);

  const allMetricsFlat = useMemo(() =>
    allMetrics.flatMap(cat => cat.metrics.map(m => ({ ...m, category: cat.category }))),
    [allMetrics]);

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

          {/* Benchmarks Section */}
          <VisualizationCard
            title="Network Benchmarks by Metric"
            titleVariant="#187663"
            data={allMetricsFlat}
            csvFilename={`network-benchmarks-${snapshot.provider_name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}`}
            csvHeaders={['Category', 'Metric', 'Network Avg', '25th Pctile', 'Median', '75th Pctile', 'Top Decile', 'Direction']}
            csvMapper={(metric) => [
              metric.category,
              metric.name,
              metric.networkAvg,
              metric.percentile25,
              metric.median,
              metric.percentile75,
              metric.topDecile,
              metric.direction
            ]}
          >
            <div className="benchmarks-section">
              <p className="benchmarks-subtitle">Percentile distribution across the network. Use this as a reference when reviewing provider performance.</p>

              {/* Filter Dropdown */}
              <div className="filter-container">
                <Autocomplete
                  multiple
                  options={categoryOptions}
                  value={selectedCategories}
                  onChange={(event, newValue) => {
                    setSelectedCategories(newValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Filter by Category"
                      placeholder="Select categories..."
                      variant="outlined"
                      size="small"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        {...getTagProps({ index })}
                        size="small"
                        style={{ backgroundColor: '#38b59c', color: 'white' }}
                      />
                    ))
                  }
                  style={{ marginBottom: '1.5rem' }}
                />
              </div>

              <div className="legend-row">
                <span className="legend-item">
                  <span className="legend-icon band"></span>
                  25th – 75th percentile band
                </span>
                <span className="legend-item">
                  <span className="legend-icon circle avg"></span>
                  Network average
                </span>
                <span className="legend-item">
                  <span className="legend-icon line"></span>
                  Median (50th)
                </span>
                <span className="legend-item">
                  <span className="legend-icon circle decile"></span>
                  Top decile
                </span>
              </div>

              {/* Filtered Metrics */}
              {filteredMetrics.map(({ category, metrics }) => (
                <div key={category} className="metrics-category">
                  <h3 className="category-title">{category.toUpperCase()}</h3>
                  <div className="metrics-list">
                    {metrics.map((metric, index) => (
                      <BenchmarkMetric key={index} {...metric} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </VisualizationCard>
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
