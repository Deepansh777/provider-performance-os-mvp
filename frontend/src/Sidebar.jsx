import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';
import {
    MdDashboard,
    MdPeople,
    MdHealthAndSafety,
    MdAttachMoney,
    MdBarChart
} from 'react-icons/md';

const Sidebar = ({ onToggleCollapse }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        {
            id: 'performance',
            name: 'Performance Command Center',
            icon: <MdDashboard size={24} />,
            path: '/performance'
        },
        {
            id: 'population',
            name: 'Population & Risk Intelligence',
            icon: <MdPeople size={24} />,
            path: '/population'
        },
        {
            id: 'quality',
            name: 'Quality & Access Improvement',
            icon: <MdHealthAndSafety size={24} />,
            path: '/quality'
        },
        {
            id: 'cost',
            name: 'Cost & Utilization Control Center',
            icon: <MdAttachMoney size={24} />,
            path: '/cost'
        },
        {
            id: 'benchmarks',
            name: 'Benchmarks & Trust Center',
            icon: <MdBarChart size={24} />,
            path: '/benchmarks'
        }
    ];

    const toggleSidebar = () => {
        const newCollapsedState = !isCollapsed;
        setIsCollapsed(newCollapsedState);
        if (onToggleCollapse) {
            onToggleCollapse(newCollapsedState);
        }
    };

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-title">
                    {isCollapsed ? (
                        <h2 className="title-collapsed">VBP</h2>
                    ) : (
                        <>
                            <h1 className="title-main">Value-Based Payment</h1>
                            <h2 className="title-sub">Provider Scorecard</h2>
                        </>
                    )}
                </div>
                <button className="toggle-btn" onClick={toggleSidebar} title="Toggle sidebar">
                    {isCollapsed ? '»' : '«'}
                </button>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        onClick={() => navigate(item.path)}
                        title={isCollapsed ? item.name : ''}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {!isCollapsed && <span className="nav-text">{item.name}</span>}
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default Sidebar;
