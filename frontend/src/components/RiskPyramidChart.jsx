import React, { useMemo } from 'react';

const RiskPyramidChart = ({ riskData }) => {
    // Define all 4 tiers with default structure
    const tierDefinitions = [
        {
            tier: 'Tier 1',
            name: 'High Risk',
            scoreRange: 'Score > 2.0',
            color: '#ef4444', // Red
            bgColor: '#fef2f2', // Very light red tint
            textColor: '#111827',
            apiName: 'High Risk'
        },
        {
            tier: 'Tier 2',
            name: 'Rising Risk',
            scoreRange: 'Score 1.5–2.0',
            color: '#f59e0b', // Orange
            bgColor: '#fffbeb', // Very light orange tint
            textColor: '#111827',
            apiName: 'Rising Risk'
        },
        {
            tier: 'Tier 3',
            name: 'Moderate Risk',
            scoreRange: 'Score 1.0–1.5',
            color: '#3b82f6', // Blue
            bgColor: '#eff6ff', // Very light blue tint
            textColor: '#111827',
            apiName: 'Moderate Risk'
        },
        {
            tier: 'Tier 4',
            name: 'Low Risk',
            scoreRange: 'Score < 1.0',
            color: '#10b981', // Green
            bgColor: '#f0fdf4', // Very light green tint
            textColor: '#111827',
            apiName: 'Low Risk'
        }
    ];

    // Merge API data with tier definitions
    const cardData = useMemo(() => {
        const dataMap = {};
        
        if (riskData && riskData.length > 0) {
            riskData.forEach(tier => {
                dataMap[tier.risk_tier] = {
                    member_count: parseFloat(tier.member_count) || 0,
                    pct_of_panel: parseFloat(tier.pct_of_panel) || 0,
                    avg_risk_score: parseFloat(tier.avg_risk_score) || 0,
                    avg_cost_pmpm: parseFloat(tier.avg_cost_pmpm) || 0
                };
            });
        }

        return tierDefinitions.map(def => ({
            ...def,
            data: dataMap[def.apiName] || null
        }));
    }, [riskData]);

    // Format currency
    const formatCurrency = (value) => {
        if (value === null || value === undefined) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatNumber = (value) => {
        if (value === null || value === undefined) return 'N/A';
        return value.toLocaleString();
    };

    const formatPercent = (value) => {
        if (value === null || value === undefined) return 'N/A';
        return `${value}%`;
    };

    const formatScore = (value) => {
        if (value === null || value === undefined) return 'N/A';
        return value.toFixed(2);
    };

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px'
        }}>
            {cardData.map((card, index) => (
                <div key={index} style={{
                    background: card.bgColor,
                    borderRadius: '8px',
                    border: `3px solid ${card.color}`,
                    borderTop: `14px solid ${card.color}`,
                    padding: '20px',
                    color: card.textColor,
                    position: 'relative',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    cursor: 'default'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                }}
                >
                    {/* Tier Label */}
                    <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#6b7280',
                        marginBottom: '4px'
                    }}>
                        {card.tier}
                    </div>

                    {/* Risk Name */}
                    <div style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        color: card.color,
                        marginBottom: '12px'
                    }}>
                        {card.name}
                    </div>

                    {/* Score Badge */}
                    <div style={{
                        display: 'inline-block',
                        background: card.color,
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#ffffff',
                        marginBottom: '20px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        {card.scoreRange}
                    </div>

                    {/* Metrics */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#6b7280', fontSize: '14px' }}>Members</span>
                            <span style={{ 
                                fontWeight: '700', 
                                fontSize: '22px', 
                                color: '#111827'
                            }}>
                                {card.data ? formatNumber(card.data.member_count) : 'N/A'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#6b7280', fontSize: '14px' }}>% of panel</span>
                            <span style={{ 
                                fontWeight: '700', 
                                fontSize: '18px', 
                                color: '#111827'
                            }}>
                                {card.data ? formatPercent(card.data.pct_of_panel) : 'N/A'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#6b7280', fontSize: '14px' }}>Avg risk score</span>
                            <span style={{ 
                                fontWeight: '700', 
                                fontSize: '18px', 
                                color: '#111827'
                            }}>
                                {card.data ? formatScore(card.data.avg_risk_score) : 'N/A'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#6b7280', fontSize: '14px' }}>Avg cost PMPM</span>
                            <span style={{ 
                                fontWeight: '700', 
                                fontSize: '18px', 
                                color: '#111827'
                            }}>
                                {card.data ? formatCurrency(card.data.avg_cost_pmpm) : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RiskPyramidChart;
