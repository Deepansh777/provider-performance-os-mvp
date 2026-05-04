import React, { useState, useRef, useEffect } from 'react';
import './Navbar.css';
import { MdKeyboardArrowDown, MdLogout } from 'react-icons/md';

const Navbar = ({ isAdmin = true }) => {
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [selectedProviderGroup, setSelectedProviderGroup] = useState('North Valley ACO');
    const menuRef = useRef(null);

    // Mock provider groups - this would come from your API
    const providerGroups = [
        { id: 1, name: 'North Valley ACO', members: 12450 },
        { id: 2, name: 'South Bay Medical Group', members: 8230 },
        { id: 3, name: 'East Coast Health Partners', members: 15670 },
        { id: 4, name: 'West Region Physicians', members: 9845 }
    ];

    // Mock user data - this would come from your auth context
    const user = {
        firstName: 'John',
        lastName: 'Doe',
        initials: 'JD'
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
        };

        if (userMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [userMenuOpen]);

    const handleProviderGroupChange = (e) => {
        setSelectedProviderGroup(e.target.value);
        // Here you would trigger a global state update or context change
        console.log('Provider group changed to:', e.target.value);
    };

    const handleUserMenuToggle = () => {
        setUserMenuOpen(!userMenuOpen);
    };

    const handleUserMenuClose = () => {
        setUserMenuOpen(false);
    };

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <div className="demo-badge">
                    DEMO
                </div>

                <div className="provider-group-section">
                    <span className="provider-label">Provider Group:</span>
                    {isAdmin ? (
                        <div className="provider-dropdown-wrapper">
                            <select
                                className="provider-dropdown"
                                value={selectedProviderGroup}
                                onChange={handleProviderGroupChange}
                            >
                                {providerGroups.map(group => (
                                    <option key={group.id} value={group.name}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                            <MdKeyboardArrowDown className="dropdown-icon" />
                        </div>
                    ) : (
                        <span className="provider-text">{selectedProviderGroup}</span>
                    )}
                </div>
            </div>

            <div className="navbar-right">
                <div className="user-section">
                    <span className="user-greeting">Welcome, {user.firstName} {user.lastName}</span>
                    <div className="user-menu-container" ref={menuRef}>
                        <button
                            className="user-avatar-btn"
                            onClick={handleUserMenuToggle}
                        >
                            <div className="user-avatar">
                                {user.initials}
                            </div>
                            <MdKeyboardArrowDown className="user-dropdown-icon" />
                        </button>

                        {userMenuOpen && (
                            <div className="user-dropdown-menu">
                                <button className="user-dropdown-item logout" onClick={handleUserMenuClose}>
                                    <MdLogout className="dropdown-item-icon" />
                                    <span>Log Out</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
