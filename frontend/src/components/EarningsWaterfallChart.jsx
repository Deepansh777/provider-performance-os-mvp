import React, { useState, useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import 'highcharts/highcharts-more';
import { Select, MenuItem, FormControl, Box } from '@mui/material';

const EarningsWaterfallChart = ({ domains }) => {
    const [viewMode, setViewMode] = useState('earned'); // 'earned' or 'missed'

    // Transform and prepare waterfall data
    const waterfallData = useMemo(() => {
        if (!domains || domains.length === 0) return null;

        // Map domain names to shortened versions
        const domainNameMap = {
            'Access & Timeliness': 'Access',
            'Quality / Care Gaps': 'Quality',
            'Hospital Costs': 'Hospital',
            'Referral & Specialty Costs': 'Referral'
        };

        // Prepare domain data with shortened names
        const domainData = domains.map(domain => ({
            fullName: domain.domain_name,
            shortName: domainNameMap[domain.domain_name] || domain.domain_name,
            earned: parseFloat(domain.earned_amount) || 0,
            missed: parseFloat(domain.missed_amount) || 0,
            available: parseFloat(domain.available_amount) || 0
        }));

        // Select value based on mode
        const valueKey = viewMode === 'earned' ? 'earned' : 'missed';

        // Sort by value ascending
        const sortedDomains = [...domainData].sort((a, b) => a[valueKey] - b[valueKey]);

        // Calculate totals
        const total = sortedDomains.reduce((sum, domain) => sum + domain[valueKey], 0);
        const totalAvailable = sortedDomains.reduce((sum, domain) => sum + domain.available, 0);

        // Build waterfall series data with cumulative percentages (relative to total available)
        const seriesData = [];
        let cumulative = 0;

        sortedDomains.forEach((domain, index) => {
            const value = domain[valueKey];
            cumulative += value;
            const cumulativePercent = totalAvailable > 0 ? (cumulative / totalAvailable * 100).toFixed(1) : 0;

            seriesData.push({
                name: domain.shortName,
                y: value,
                fullName: domain.fullName,
                color: viewMode === 'earned' ? '#10b981' : '#ef4444',
                cumulative: cumulative,
                cumulativePercent: cumulativePercent,
                available: domain.available,
                earned: domain.earned,
                missed: domain.missed,
                dataLabels: {
                    enabled: true,
                    format: '{point.cumulativePercent}%',
                    backgroundColor: '#e5e7eb',
                    padding: 4,
                    borderRadius: 3,
                    style: {
                        fontWeight: 'bold',
                        fontSize: '14px',
                        color: '#000000',
                        textOutline: 'none'
                    }
                }
            });
        });

        // Add total bar
        const totalPercent = totalAvailable > 0 ? (total / totalAvailable * 100).toFixed(1) : 0;
        seriesData.push({
            name: viewMode === 'earned' ? 'Total Earned' : 'Total Missed',
            isSum: true,
            color: '#f59e0b',
            cumulative: total,
            cumulativePercent: totalPercent,
            totalAvailable: totalAvailable,
            dataLabels: {
                enabled: true,
                format: `${totalPercent}%`,
                backgroundColor: '#e5e7eb',
                padding: 4,
                borderRadius: 3,
                style: {
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: '#000000',
                    textOutline: 'none'
                }
            }
        });

        return {
            categories: [...sortedDomains.map(d => d.shortName), viewMode === 'earned' ? 'Total Earned' : 'Total Missed'],
            series: seriesData,
            total: total,
            sortedDomains: sortedDomains
        };
    }, [domains, viewMode]);

    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    if (!waterfallData) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>No data available</div>;
    }

    const chartOptions = {
        chart: {
            type: 'waterfall',
            height: 280,
            backgroundColor: 'transparent',
            style: {
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
            }
        },
        title: {
            text: null
        },
        credits: {
            enabled: false
        },
        xAxis: {
            type: 'category',
            categories: waterfallData.categories,
            lineColor: '#e5e7eb',
            tickColor: '#e5e7eb',
            labels: {
                style: {
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151'
                }
            }
        },
        yAxis: {
            title: {
                text: 'Amount ($)',
                style: {
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#6b7280'
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
            }
        },
        legend: {
            enabled: false
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
                let html = `<div style="min-width: 200px;">`;

                if (point.fullName) {
                    html += `<div style="font-weight: 700; margin-bottom: 8px; font-size: 15px; color: #111827;">${point.fullName}</div>`;
                } else {
                    html += `<div style="font-weight: 700; margin-bottom: 8px; font-size: 15px; color: #111827;">${point.name}</div>`;
                }

                if (point.isSum) {
                    html += `<div style="margin-bottom: 4px; font-size: 14px;"><span style="color: #6b7280;">Total:</span> <span style="font-weight: 600;">${formatCurrency(point.cumulative)}</span></div>`;
                    html += `<div style="margin-bottom: 4px; font-size: 14px;"><span style="color: #6b7280;">Total Available:</span> <span style="font-weight: 600;">${formatCurrency(point.totalAvailable)}</span></div>`;
                } else {
                    html += `<div style="margin-bottom: 4px; font-size: 14px;"><span style="color: #6b7280;">Amount:</span> <span style="font-weight: 600;">${formatCurrency(point.y)}</span></div>`;
                    html += `<div style="margin-bottom: 4px; font-size: 14px;"><span style="color: #6b7280;">Available:</span> <span style="font-weight: 600;">${formatCurrency(point.available)}</span></div>`;
                    html += `<div style="margin-bottom: 4px; font-size: 14px;"><span style="color: #6b7280;">Cumulative:</span> <span style="font-weight: 600;">${formatCurrency(point.cumulative)}</span></div>`;
                    html += `<div style="padding-top: 4px; border-top: 1px solid #e5e7eb; margin-top: 4px; font-size: 14px;"><span style="color: #6b7280;">Cumulative %:</span> <span style="font-weight: 700; color: #059669;">${point.cumulativePercent}%</span></div>`;
                }

                html += `</div>`;
                return html;
            }
        },
        plotOptions: {
            waterfall: {
                dataLabels: {
                    enabled: true,
                    verticalAlign: 'top',
                    y: -5
                },
                borderWidth: 0,
                borderRadius: 4,
                lineWidth: 2,
                lineColor: '#d1d5db',
                states: {
                    hover: {
                        brightness: 0.1
                    }
                }
            }
        },
        series: [{
            name: viewMode === 'earned' ? 'Earned Amount' : 'Missed Amount',
            upColor: viewMode === 'earned' ? '#10b981' : '#ef4444',
            color: viewMode === 'earned' ? '#10b981' : '#ef4444',
            data: waterfallData.series,
            pointPadding: 0.1,
            groupPadding: 0.15
        }]
    };

    return (
        <Box>
            <Box sx={{
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2
            }}>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <Select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                        sx={{
                            backgroundColor: '#f9fafb',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#e5e7eb',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#38b59c',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#38b59c',
                            },
                            fontSize: '14px',
                            fontWeight: 600
                        }}
                    >
                        <MenuItem value="earned">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '2px',
                                    backgroundColor: '#10b981'
                                }} />
                                Earned Amount
                            </Box>
                        </MenuItem>
                        <MenuItem value="missed">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '2px',
                                    backgroundColor: '#ef4444'
                                }} />
                                Missed Opportunity
                            </Box>
                        </MenuItem>
                    </Select>
                </FormControl>
                <Box sx={{
                    fontSize: '13px',
                    color: '#6b7280',
                    fontWeight: 500
                }}>
                    {viewMode === 'earned'
                        ? `Total Earned: ${formatCurrency(waterfallData.total)}`
                        : `Total Missed: ${formatCurrency(waterfallData.total)}`
                    }
                </Box>
            </Box>

            <HighchartsReact
                highcharts={Highcharts}
                options={chartOptions}
            />
        </Box>
    );
};

export default EarningsWaterfallChart;
