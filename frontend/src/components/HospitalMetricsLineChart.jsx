import React, { useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const HospitalMetricsLineChart = ({ monthlyData, metricNames, title, yAxisLabel, height = 300 }) => {
  const chartOptions = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) {
      return null;
    }

    // Filter data for the specified metrics
    const filteredMetrics = monthlyData.filter(metric => metricNames.includes(metric.metric_name));

    // Extract unique dates across all metrics
    const dates = [...new Set(
      filteredMetrics.flatMap(metric =>
        metric.data.map(d => d.reporting_period)
      )
    )].sort();

    // Prepare series data
    const series = [];

    filteredMetrics.forEach(metric => {
      // Create a map of date to value for quick lookup
      const dataMap = new Map(
        metric.data.map(d => [d.reporting_period, d.metric_value])
      );

      // Provider value series
      series.push({
        name: metric.metric_display_name,
        data: dates.map(date => dataMap.get(date) || null),
        type: 'line',
        color: 'orange',
        marker: {
          enabled: true,
          radius: 3
        },
        lineWidth: 3,
        unitType: metric.unit_type
      });

      // Benchmark series (only add once per metric, use dashed line)
      const benchmarkMap = new Map(
        metric.data.map(d => [d.reporting_period, d.benchmark_value])
      );

      const benchmarkValue = benchmarkMap.get(dates[0]); // Benchmark should be constant
      if (benchmarkValue) {
        series.push({
          name: `${metric.metric_display_name} - Benchmark`,
          data: dates.map(() => benchmarkValue),
          type: 'line',
          dashStyle: 'Dash',
          marker: {
            enabled: false
          },
          lineWidth: 2,
          color: '#9ca3af',
          enableMouseTracking: true,
          unitType: metric.unit_type
        });
      }
    });

    return {
      chart: {
        height: height,
        backgroundColor: 'transparent',
        style: {
          fontFamily: 'inherit'
        }
      },
      title: {
        text: title,
        align: 'left',
        style: {
          fontSize: '14px',
          fontWeight: '600',
          color: '#111827'
        }
      },
      xAxis: {
        categories: dates.map(date => {
          const d = new Date(date);
          return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        }),
        labels: {
          style: {
            fontSize: '13px',
            color: '#6b7280'
          }
        },
        gridLineWidth: 0
      },
      yAxis: {
        title: {
          text: yAxisLabel,
          style: {
            fontSize: '12px',
            color: '#6b7280'
          }
        },
        labels: {
          style: {
            fontSize: '13px',
            color: '#6b7280'
          }
        },
        gridLineColor: '#e5e7eb',
        gridLineWidth: 1
      },
      legend: {
        enabled: true,
        align: 'center',
        verticalAlign: 'bottom',
        layout: 'horizontal',
        itemStyle: {
          fontSize: '13px',
          color: '#374151',
          fontWeight: '400'
        }
      },
      tooltip: {
        shared: true,
        backgroundColor: '#ffffff',
        borderColor: '#d1d5db',
        borderRadius: 6,
        padding: 10,
        style: {
          fontSize: '14px'
        },
        useHTML: true,
        formatter: function () {
          let tooltip = `<b>${this.x}</b><br/>`;
          this.points.forEach(point => {
            const isDashed = point.series.options.dashStyle === 'Dash';
            const unitType = point.series.options.unitType;
            const isCostMetric = unitType === '$' || unitType === 'PMPM';

            let formattedValue;
            if (isCostMetric) {
              formattedValue = '$' + point.y?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
            } else if (unitType === '%') {
              formattedValue = point.y?.toFixed(1) + '%';
            } else {
              formattedValue = point.y?.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
            }

            tooltip += `<span style="color:${point.color}">\u25CF</span> ${point.series.name}: <b>${formattedValue}</b><br/>`;
          });
          return tooltip;
        }
      },
      series: series,
      credits: {
        enabled: false
      },
      plotOptions: {
        series: {
          marker: {
            lineWidth: 1,
            lineColor: '#fff'
          }
        }
      }
    };
  }, [monthlyData, metricNames, title, yAxisLabel, height]);

  if (!chartOptions) {
    return (
      <div style={{
        height: `${height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6b7280',
        fontSize: '14px'
      }}>
        No data available
      </div>
    );
  }

  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={chartOptions}
    />
  );
};

export default HospitalMetricsLineChart;
