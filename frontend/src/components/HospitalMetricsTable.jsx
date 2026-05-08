import React, { useState, useMemo } from 'react';
import './HospitalMetricsTable.css';

const HospitalMetricsTable = ({ metrics }) => {
    const [sortField, setSortField] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');

    if (!metrics || metrics.length === 0) {
        return <div className="no-data">No hospital metrics data available</div>;
    }

    // Handle sorting
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Sort metrics array
    const sortMetrics = (metricsArray) => {
        if (!sortField) return metricsArray;

        return [...metricsArray].sort((a, b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];

            // Handle null/undefined values
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            // Compare values
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    };

    // Render sort indicator
    const renderSortIndicator = (field) => {
        if (sortField !== field) {
            return <span className="sort-indicator">⇅</span>;
        }
        return sortDirection === 'asc'
            ? <span className="sort-indicator active">▲</span>
            : <span className="sort-indicator active">▼</span>;
    };

    // Format values based on unit type
    const formatValue = (value, unitType) => {
        if (value === null || value === undefined) return '—';

        switch (unitType) {
            case '$':
                return `$${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
            case 'PMPM':
                return `$${parseFloat(value).toFixed(2)}`;
            case '%':
                return `${parseFloat(value).toFixed(1)}%`;
            case '/1000':
                return parseFloat(value).toFixed(1);
            case 'score':
                return parseFloat(value).toFixed(1);
            default:
                return parseFloat(value).toFixed(1);
        }
    };

    // Format delta with color
    const formatDelta = (delta, direction, unitType) => {
        if (delta === null || delta === undefined) return '—';

        const sign = delta >= 0 ? '+' : '';
        const isGood = (direction === 'lower_better' && delta < 0) ||
            (direction === 'higher_better' && delta > 0);
        const className = isGood ? 'delta-good' : 'delta-bad';

        let formatted;
        if (unitType === '$') {
            formatted = `${sign}$${Math.abs(delta).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        } else if (unitType === 'PMPM') {
            formatted = `${sign}$${Math.abs(delta).toFixed(2)}`;
        } else if (unitType === '%') {
            formatted = `${sign}${Math.abs(delta).toFixed(2)}`;
        } else {
            formatted = `${sign}${Math.abs(delta).toFixed(2)}`;
        }

        return <span className={className}>{formatted}</span>;
    };

    // Format vs benchmark
    const formatVsBenchmark = (value, unitType) => {
        if (value === null || value === undefined) return '—';

        const sign = value >= 0 ? '+' : '';
        if (unitType === '$') {
            return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        } else if (unitType === 'PMPM') {
            return `${sign}$${value.toFixed(2)}`;
        } else if (unitType === '%') {
            return `${sign}${value.toFixed(2)}`;
        }
        return `${sign}${value.toFixed(2)}`;
    };

    // Performance badge
    const getPerformanceBadge = (status) => {
        if (status === 'above') {
            return <span className="badge badge-above">Above</span>;
        } else if (status === 'below') {
            return <span className="badge badge-below">Below</span>;
        }
        return <span className="badge badge-at">At / Below</span>;
    };

    // Trend indicator
    const getTrendIndicator = (trend) => {
        if (trend === 'improving') {
            return <span className="trend trend-improving">▼ Improving</span>;
        } else if (trend === 'worsening') {
            return <span className="trend trend-worsening">▲ Worsening</span>;
        }
        return <span className="trend trend-stable">— Stable</span>;
    };

    // Group by category
    const utilization = sortMetrics(metrics.filter(m => m.metric_category === 'utilization'));
    const cost = sortMetrics(metrics.filter(m => m.metric_category === 'cost'));
    const quality = sortMetrics(metrics.filter(m => m.metric_category === 'score'));

    return (
        <div className="hospital-table-wrapper">
            <table className="hospital-table">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('metric_display_name')} className="sortable">
                            METRIC {renderSortIndicator('metric_display_name')}
                        </th>
                        <th onClick={() => handleSort('r12_value')} className="sortable">
                            R12 VALUE {renderSortIndicator('r12_value')}
                        </th>
                        <th onClick={() => handleSort('prior_12_value')} className="sortable">
                            PRIOR 12 {renderSortIndicator('prior_12_value')}
                        </th>
                        <th onClick={() => handleSort('yoy_delta')} className="sortable">
                            YOY Δ {renderSortIndicator('yoy_delta')}
                        </th>
                        <th onClick={() => handleSort('benchmark_value')} className="sortable">
                            BENCHMARK {renderSortIndicator('benchmark_value')}
                        </th>
                        <th onClick={() => handleSort('vs_benchmark')} className="sortable">
                            VS BENCHMARK {renderSortIndicator('vs_benchmark')}
                        </th>
                        <th onClick={() => handleSort('status')} className="sortable">
                            PERFORMANCE {renderSortIndicator('status')}
                        </th>
                        <th onClick={() => handleSort('trend')} className="sortable">
                            TREND {renderSortIndicator('trend')}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {/* UTILIZATION */}
                    <tr className="category-row">
                        <td colSpan="8">UTILIZATION</td>
                    </tr>
                    {utilization.map((metric, idx) => (
                        <tr key={idx}>
                            <td className="metric-col">
                                <span className="bullet">●</span> {metric.metric_display_name}
                            </td>
                            <td className="value-col">{formatValue(metric.r12_value, metric.unit_type)}</td>
                            <td className="value-col">{formatValue(metric.prior_12_value, metric.unit_type)}</td>
                            <td className="delta-col">{formatDelta(metric.yoy_delta, metric.direction, metric.unit_type)}</td>
                            <td className="benchmark-col">{formatValue(metric.benchmark_value, metric.unit_type)}</td>
                            <td className="delta-col">{formatVsBenchmark(metric.vs_benchmark, metric.unit_type)}</td>
                            <td className="badge-col">{getPerformanceBadge(metric.status)}</td>
                            <td className="trend-col">{getTrendIndicator(metric.trend)}</td>
                        </tr>
                    ))}

                    {/* COST */}
                    {cost.length > 0 && (
                        <>
                            <tr className="category-row">
                                <td colSpan="8">COST</td>
                            </tr>
                            {cost.map((metric, idx) => (
                                <tr key={`cost-${idx}`}>
                                    <td className="metric-col">
                                        <span className="bullet">●</span> {metric.metric_display_name}
                                    </td>
                                    <td className="value-col">{formatValue(metric.r12_value, metric.unit_type)}</td>
                                    <td className="value-col">{formatValue(metric.prior_12_value, metric.unit_type)}</td>
                                    <td className="delta-col">{formatDelta(metric.yoy_delta, metric.direction, metric.unit_type)}</td>
                                    <td className="benchmark-col">{formatValue(metric.benchmark_value, metric.unit_type)}</td>
                                    <td className="delta-col">{formatVsBenchmark(metric.vs_benchmark, metric.unit_type)}</td>
                                    <td className="badge-col">{getPerformanceBadge(metric.status)}</td>
                                    <td className="trend-col">{getTrendIndicator(metric.trend)}</td>
                                </tr>
                            ))}
                        </>
                    )}

                    {/* POST-ACUTE & QUALITY */}
                    {quality.length > 0 && (
                        <>
                            <tr className="category-row">
                                <td colSpan="8">POST-ACUTE & QUALITY</td>
                            </tr>
                            {quality.map((metric, idx) => (
                                <tr key={`quality-${idx}`}>
                                    <td className="metric-col">
                                        <span className="bullet">●</span> {metric.metric_display_name}
                                    </td>
                                    <td className="value-col">{formatValue(metric.r12_value, metric.unit_type)}</td>
                                    <td className="value-col">{formatValue(metric.prior_12_value, metric.unit_type)}</td>
                                    <td className="delta-col">{formatDelta(metric.yoy_delta, metric.direction, metric.unit_type)}</td>
                                    <td className="benchmark-col">{formatValue(metric.benchmark_value, metric.unit_type)}</td>
                                    <td className="delta-col">{formatVsBenchmark(metric.vs_benchmark, metric.unit_type)}</td>
                                    <td className="badge-col">{getPerformanceBadge(metric.status)}</td>
                                    <td className="trend-col">{getTrendIndicator(metric.trend)}</td>
                                </tr>
                            ))}
                        </>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default HospitalMetricsTable;
