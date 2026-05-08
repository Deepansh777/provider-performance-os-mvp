import React, { useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import 'highcharts/highcharts-more';

const ChronicConditionBubbleChart = ({ conditionData }) => {
    // Transform data for bubble chart
    const chartData = useMemo(() => {
        if (!conditionData || conditionData.length === 0) return null;

        // Color scale based on uncontrolled percentage
        const getColor = (uncontrolledPct) => {
            if (uncontrolledPct >= 70) return '#ef4444'; // Red - high risk
            if (uncontrolledPct >= 50) return '#f59e0b'; // Orange
            if (uncontrolledPct >= 30) return '#eab308'; // Yellow
            return '#10b981'; // Green - well controlled
        };

        return conditionData.map(condition => ({
            name: condition.condition_name,
            x: parseFloat(condition.uncontrolled_pct) || 0,
            y: parseFloat(condition.avg_cost_pmpm) || 0,
            z: parseFloat(condition.member_count) || 0,
            member_count: parseFloat(condition.member_count) || 0,
            prevalence_pct: parseFloat(condition.prevalence_pct) || 0,
            controlled_pct: parseFloat(condition.controlled_pct) || 0,
            uncontrolled_pct: parseFloat(condition.uncontrolled_pct) || 0,
            color: getColor(parseFloat(condition.uncontrolled_pct) || 0)
        }));
    }, [conditionData]);

    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    if (!chartData) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>No chronic condition data available</div>;
    }

    const chartOptions = {
        chart: {
            type: 'bubble',
            plotBorderWidth: 1,
            plotBorderColor: '#e5e7eb',
            height: 430,
            backgroundColor: 'transparent',
            style: {
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
            },
            zoomType: 'xy',
            marginTop: 90
        },
        title: {
            text: null
        },
        subtitle: {
            text: 'Bubble size reflects condition prevalence (member count). Top-right quadrant (high cost + high uncontrolled %) = highest priority for intervention. Bottom-left (low cost + low uncontrolled %) = well-managed conditions.',
            style: {
                fontSize: '13px',
                color: '#6b7280',
                fontWeight: '400'
            },
            align: 'left',
            x: 10
        },
        credits: {
            enabled: false
        },
        legend: {
            enabled: false
        },
        xAxis: {
            title: {
                text: 'Uncontrolled % (Care Gap)',
                style: {
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                }
            },
            gridLineWidth: 1,
            gridLineColor: '#f3f4f6',
            lineColor: '#e5e7eb',
            labels: {
                format: '{value}%',
                style: {
                    fontSize: '13px',
                    color: '#6b7280'
                }
            },
            plotBands: [{
                from: 0,
                to: 50,
                color: 'rgba(16, 185, 129, 0.03)', // Very light green
                zIndex: 0
            }, {
                from: 50,
                to: 100,
                color: 'rgba(239, 68, 68, 0.03)', // Very light red
                zIndex: 0
            }],
            plotLines: [{
                color: '#9ca3af',
                dashStyle: 'dash',
                value: 50,
                width: 2,
                zIndex: 3,
                label: {
                    text: '50% Threshold',
                    style: {
                        color: '#6b7280',
                        fontSize: '11px',
                        fontWeight: '600'
                    },
                    align: 'center',
                    y: 15
                }
            }]
        },
        yAxis: {
            title: {
                text: 'Avg Cost PMPM ($)',
                style: {
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                }
            },
            gridLineColor: '#f3f4f6',
            labels: {
                formatter: function () {
                    return formatCurrency(this.value);
                },
                style: {
                    fontSize: '13px',
                    color: '#6b7280'
                }
            },
            startOnTick: false,
            endOnTick: false,
            plotLines: [{
                color: '#9ca3af',
                dashStyle: 'dash',
                value: chartData.reduce((sum, d) => sum + d.y, 0) / chartData.length,
                width: 2,
                zIndex: 3,
                label: {
                    text: 'Avg Cost',
                    style: {
                        color: '#6b7280',
                        fontSize: '11px',
                        fontWeight: '600'
                    },
                    align: 'right',
                    x: -10
                }
            }]
        },
        tooltip: {
            useHTML: true,
            backgroundColor: '#ffffff',
            borderColor: '#e5e7eb',
            borderRadius: 8,
            padding: 12,
            shadow: {
                color: 'rgba(0, 0, 0, 0.1)',
                offsetX: 0,
                offsetY: 2,
                opacity: 0.1,
                width: 4
            },
            style: {
                fontSize: '14px',
                color: '#374151'
            },
            formatter: function () {
                const point = this.point;
                return `
                    <div style="min-width: 240px;">
                        <div style="font-weight: 700; margin-bottom: 10px; font-size: 15px; color: #111827; border-bottom: 2px solid ${point.color}; padding-bottom: 6px;">
                            ${point.name}
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                            <span style="color: #6b7280; font-weight: 500;">Members:</span>
                            <span style="font-weight: 700; color: #111827;">${point.member_count.toLocaleString()}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                            <span style="color: #6b7280; font-weight: 500;">Prevalence:</span>
                            <span style="font-weight: 700; color: #111827;">${point.prevalence_pct}%</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                            <span style="color: #6b7280; font-weight: 500;">Controlled:</span>
                            <span style="font-weight: 700; color: #10b981;">${point.controlled_pct}%</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                            <span style="color: #6b7280; font-weight: 500;">Uncontrolled:</span>
                            <span style="font-weight: 700; color: #ef4444;">${point.uncontrolled_pct}%</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #6b7280; font-weight: 500;">Avg Cost PMPM:</span>
                            <span style="font-weight: 700; color: #111827;">${formatCurrency(point.y)}</span>
                        </div>
                    </div>
                `;
            }
        },
        plotOptions: {
            bubble: {
                minSize: 20,
                maxSize: 100,
                dataLabels: {
                    enabled: true,
                    formatter: function () {
                        return this.point.name;
                    },
                    style: {
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#111827',
                        textOutline: '2px white'
                    },
                    y: -2
                }
            },
            series: {
                states: {
                    hover: {
                        enabled: true,
                        brightness: 0.1
                    }
                }
            }
        },
        series: [{
            name: 'Conditions',
            data: chartData
        }]
    };

    return (
        <div>
            <HighchartsReact
                highcharts={Highcharts}
                options={chartOptions}
            />
        </div>
    );
};

export default ChronicConditionBubbleChart;
