import React, { useState, useEffect } from 'react';
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  OutlinedInput,
  Chip,
  Box
} from '@mui/material';
import VisualizationCard from '../components/VisualizationCard';
import HospitalMetricsTable from '../components/HospitalMetricsTable';
import HospitalMetricsLineChart from '../components/HospitalMetricsLineChart';
import { providersAPI } from '../api';

const CostUtilizationControl = ({ snapshot }) => {
  const [hospitalMetrics, setHospitalMetrics] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Define cost metrics (dollar-based)
  const costMetrics = [
    { id: 'avg_cost_per_admission', label: 'Average Cost per Admission' },
    { id: 'total_inpatient_cost_pmpm', label: 'Total Inpatient Cost PMPM' },
    { id: 'snf_post_acute_cost_pmpm', label: 'SNF / Post-Acute Cost PMPM' }
  ];

  // Define utilization metrics (count-based)
  const utilizationMetrics = [
    { id: 'admissions_per_1000', label: 'Admissions / 1,000' },
    { id: 'er_visits_per_1000', label: 'ER Visits / 1,000' },
    { id: 'readmission_rate_30d', label: '30-Day Readmission Rate' },
    { id: 'avoidable_er_rate', label: 'Avoidable ER Rate' },
    { id: 'observation_stays_per_1000', label: 'Observation Stays / 1,000' },
    { id: 'hospital_cost_score', label: 'Hospital Cost Score' }
  ];

  // State for selected metrics (initialize with first metric only)
  const [selectedCostMetrics, setSelectedCostMetrics] = useState([costMetrics[0].id]);
  const [selectedUtilizationMetrics, setSelectedUtilizationMetrics] = useState([utilizationMetrics[0].id]);

  useEffect(() => {
    const fetchHospitalMetrics = async () => {
      if (!snapshot?.provider_id) {
        setHospitalMetrics([]);
        setMonthlyData([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch both R12 summary and monthly time-series data
        const [metricsResponse, monthlyResponse] = await Promise.all([
          providersAPI.getHospitalMetrics(
            snapshot.provider_id,
            snapshot.reporting_period || '2025-12-31'
          ),
          providersAPI.getHospitalMetricsMonthly(snapshot.provider_id, 12)
        ]);

        if (metricsResponse.data.success) {
          setHospitalMetrics(metricsResponse.data.data);
        }

        if (monthlyResponse.data.success) {
          setMonthlyData(monthlyResponse.data.data);
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

  // Handlers for metric selection
  const handleCostMetricsChange = (event) => {
    const value = event.target.value;
    setSelectedCostMetrics(typeof value === 'string' ? value.split(',') : value);
  };

  const handleUtilizationMetricsChange = (event) => {
    const value = event.target.value;
    setSelectedUtilizationMetrics(typeof value === 'string' ? value.split(',') : value);
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

          {/* Monthly Trend Charts */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem',
            marginTop: '1.5rem'
          }}>
            {/* Cost Metrics Chart */}
            <VisualizationCard
              title="Cost Metrics — 12-Month Trend"
              data={monthlyData.filter(m => selectedCostMetrics.includes(m.metric_name))}
              csvFilename="hospital-cost-metrics-monthly"
              csvHeaders={['Month', ...monthlyData.filter(m => selectedCostMetrics.includes(m.metric_name)).map(m => m.metric_display_name)]}
              csvMapper={(_, idx, allData) => {
                const dates = [...new Set(allData.flatMap(m => m.data.map(d => d.reporting_period)))].sort();
                return dates.map(date => {
                  const row = [date];
                  allData.forEach(metric => {
                    const dataPoint = metric.data.find(d => d.reporting_period === date);
                    row.push(dataPoint?.metric_value || '');
                  });
                  return row;
                }).flat();
              }}
            >
              {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                  Loading...
                </div>
              ) : (
                <>
                  <FormControl
                    sx={{
                      m: 2,
                      minWidth: 300,
                      maxWidth: 500
                    }}
                    size="small"
                  >
                    <InputLabel id="cost-metrics-select-label">Select Metrics</InputLabel>
                    <Select
                      labelId="cost-metrics-select-label"
                      id="cost-metrics-select"
                      multiple
                      value={selectedCostMetrics}
                      onChange={handleCostMetricsChange}
                      input={<OutlinedInput label="Select Metrics" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const metric = costMetrics.find(m => m.id === value);
                            return (
                              <Chip
                                key={value}
                                label={metric?.label || value}
                                size="small"
                              />
                            );
                          })}
                        </Box>
                      )}
                    >
                      {costMetrics.map((metric) => (
                        <MenuItem key={metric.id} value={metric.id}>
                          {metric.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <HospitalMetricsLineChart
                    monthlyData={monthlyData}
                    metricNames={selectedCostMetrics}
                    title=""
                    yAxisLabel="Cost ($)"
                    height={300}
                  />
                </>
              )}
            </VisualizationCard>

            {/* Utilization Metrics Chart */}
            <VisualizationCard
              title="Utilization Metrics — 12-Month Trend"
              data={monthlyData.filter(m => selectedUtilizationMetrics.includes(m.metric_name))}
              csvFilename="hospital-utilization-metrics-monthly"
              csvHeaders={['Month', ...monthlyData.filter(m => selectedUtilizationMetrics.includes(m.metric_name)).map(m => m.metric_display_name)]}
              csvMapper={(_, idx, allData) => {
                const dates = [...new Set(allData.flatMap(m => m.data.map(d => d.reporting_period)))].sort();
                return dates.map(date => {
                  const row = [date];
                  allData.forEach(metric => {
                    const dataPoint = metric.data.find(d => d.reporting_period === date);
                    row.push(dataPoint?.metric_value || '');
                  });
                  return row;
                }).flat();
              }}
            >
              {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                  Loading...
                </div>
              ) : (
                <>
                  <FormControl
                    sx={{
                      m: 2,
                      minWidth: 300,
                      maxWidth: 500
                    }}
                    size="small"
                  >
                    <InputLabel id="utilization-metrics-select-label">Select Metrics</InputLabel>
                    <Select
                      labelId="utilization-metrics-select-label"
                      id="utilization-metrics-select"
                      multiple
                      value={selectedUtilizationMetrics}
                      onChange={handleUtilizationMetricsChange}
                      input={<OutlinedInput label="Select Metrics" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const metric = utilizationMetrics.find(m => m.id === value);
                            return (
                              <Chip
                                key={value}
                                label={metric?.label || value}
                                size="small"
                              />
                            );
                          })}
                        </Box>
                      )}
                    >
                      {utilizationMetrics.map((metric) => (
                        <MenuItem key={metric.id} value={metric.id}>
                          {metric.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <HospitalMetricsLineChart
                    monthlyData={monthlyData}
                    metricNames={selectedUtilizationMetrics}
                    title=""
                    yAxisLabel="Rate / Count / Score"
                    height={300}
                  />
                </>
              )}
            </VisualizationCard>
          </div>
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
