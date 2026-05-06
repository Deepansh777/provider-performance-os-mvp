import React, { useState, useRef, useEffect } from 'react';
import './Navbar.css';
import { MdKeyboardArrowDown, MdLogout } from 'react-icons/md';
import { Select, MenuItem, FormControl } from '@mui/material';
import { organizationsAPI } from './api';
import { logout } from './authUtils';

const Navbar = ({ isAdmin = true, onOrganizationChange, user: authUser }) => {
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
    const [loading, setLoading] = useState(true);
    const menuRef = useRef(null);

    // Get user data from auth context or use mock data
    const user = authUser || {
        firstName: 'John',
        lastName: 'Doe',
        initials: 'JD'
    };

    // Extract initials from full_name if available
    const getInitials = () => {
        if (authUser?.full_name) {
            const names = authUser.full_name.split(' ');
            return names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return user.initials;
    };

    const getUserFirstName = () => {
        if (authUser?.full_name) {
            return authUser.full_name.split(' ')[0];
        }
        return user.firstName;
    };

    const getUserLastName = () => {
        if (authUser?.full_name) {
            const names = authUser.full_name.split(' ');
            return names.length > 1 ? names[names.length - 1] : '';
        }
        return user.lastName;
    };

    // Fetch organizations on mount
    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                setLoading(true);
                const response = await organizationsAPI.getAll();
                if (response.data.success) {
                    setOrganizations(response.data.data);
                    // Set first organization as default if available
                    if (response.data.data.length > 0) {
                        const firstOrgId = response.data.data[0].id;
                        setSelectedOrganizationId(firstOrgId);
                        // Notify parent of initial organization
                        if (onOrganizationChange) {
                            onOrganizationChange(firstOrgId);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch organizations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrganizations();
    }, [onOrganizationChange]);

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

    const handleProviderGroupChange = (event) => {
        const orgId = event.target.value;
        setSelectedOrganizationId(orgId);
        // Notify parent component of organization change
        if (onOrganizationChange) {
            onOrganizationChange(orgId);
        }
    };

    const getSelectedOrganizationName = () => {
        const org = organizations.find(o => o.id === selectedOrganizationId);
        return org ? org.organization_name : '';
    };

    const handleUserMenuToggle = () => {
        setUserMenuOpen(!userMenuOpen);
    };

    const handleUserMenuClose = () => {
        setUserMenuOpen(false);
    };

    const handleLogout = () => {
        handleUserMenuClose();
        logout();
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
                        <FormControl size="small" className="provider-dropdown-wrapper">
                            <Select
                                value={selectedOrganizationId}
                                onChange={handleProviderGroupChange}
                                disabled={loading}
                                displayEmpty
                                className="mui-provider-dropdown"
                                sx={{
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '8px',
                                    minWidth: '220px',
                                    fontSize: '0.9375rem',
                                    fontWeight: 600,
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#e5e7eb',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#d1d5db',
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#3b82f6',
                                        borderWidth: '1px',
                                    },
                                    '& .MuiSelect-select': {
                                        padding: '0.5rem 0.875rem',
                                    }
                                }}
                            >
                                {loading ? (
                                    <MenuItem value="">Loading...</MenuItem>
                                ) : (
                                    organizations.map((org) => (
                                        <MenuItem key={org.id} value={org.id}>
                                            {org.organization_name}
                                        </MenuItem>
                                    ))
                                )}
                            </Select>
                        </FormControl>
                    ) : (
                        <span className="provider-text">{getSelectedOrganizationName()}</span>
                    )}
                </div>
            </div>

            <div className="navbar-right">
                <div className="user-section">
                    <span className="user-greeting">Welcome, {getUserFirstName()} {getUserLastName()}</span>
                    <div className="user-menu-container" ref={menuRef}>
                        <button
                            className="user-avatar-btn"
                            onClick={handleUserMenuToggle}
                        >
                            <div className="user-avatar">
                                {getInitials()}
                            </div>
                            <MdKeyboardArrowDown className="user-dropdown-icon" />
                        </button>

                        {userMenuOpen && (
                            <div className="user-dropdown-menu">
                                <button className="user-dropdown-item logout" onClick={handleLogout}>
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
