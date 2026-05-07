import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { providersAPI } from './api';
import { verifyToken, isAuthenticated as checkIsAuthenticated } from './authUtils';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import PerformanceCommandCenter from './pages/PerformanceCommandCenter';
import PopulationRiskIntelligence from './pages/PopulationRiskIntelligence';
import QualityAccessImprovement from './pages/QualityAccessImprovement';
import CostUtilizationControl from './pages/CostUtilizationControl';
import BenchmarksTrustCenter from './pages/BenchmarksTrustCenter';

function App() {
  // Dev mode check
  const isDevMode = process.env.REACT_APP_DISABLE_AUTH === 'true';

  // Authentication state
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(isDevMode);
  const [user, setUser] = useState(isDevMode ? {
    email: 'dev@localhost.com',
    full_name: 'Dev User',
    role: 'admin',
    organization_id: 1,
    login_enabled: true,
    active_flag: true
  } : null);
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);
  const [authLoading, setAuthLoading] = useState(!isDevMode);

  // App state
  const [snapshot, setSnapshot] = useState(null);
  const [domains, setDomains] = useState(null);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Verify authentication on mount and refresh
  useEffect(() => {
    // Skip auth check in dev mode
    if (isDevMode) {
      setAuthLoading(false);
      setSelectedOrganizationId(1);
      return;
    }

    const checkAuth = async () => {
      try {
        const authenticated = await checkIsAuthenticated();
        if (authenticated) {
          // Verify with backend and get user data
          const userData = await verifyToken();
          if (userData) {
            setUser(userData);
            setIsUserAuthenticated(true);
            setSelectedOrganizationId(userData.organization_id);
          } else {
            setIsUserAuthenticated(false);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsUserAuthenticated(false);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [isDevMode]);

  // Handle successful login
  const handleLoginSuccess = async (userData, needsPasswordChange, token) => {
    if (needsPasswordChange) {
      setPasswordChangeRequired(true);
    } else {
      // Fetch user data from backend
      const backendUser = await verifyToken();
      if (backendUser) {
        setUser(backendUser);
        setIsUserAuthenticated(true);
        setSelectedOrganizationId(backendUser.organization_id);
      }
    }
  };

  // Handle successful password change
  const handlePasswordChanged = async () => {
    setPasswordChangeRequired(false);
    // Fetch user data from backend after password change
    const backendUser = await verifyToken();
    if (backendUser) {
      setUser(backendUser);
      setIsUserAuthenticated(true);
      setSelectedOrganizationId(backendUser.organization_id);
    }
  };

  const fetchSnapshotForOrganization = useCallback(async (organizationId) => {
    try {
      // First, get all providers for this organization
      const providersResponse = await providersAPI.getAll(organizationId);

      if (providersResponse.data.success && providersResponse.data.data.length > 0) {
        // Get the first provider's ID
        const firstProviderId = providersResponse.data.data[0].id;

        // Fetch snapshot and domains for the first provider, reporting period Dec-25
        const [snapshotResponse, domainsResponse] = await Promise.all([
          providersAPI.getSnapshot(firstProviderId, '2025-12-31'),
          providersAPI.getDomains(firstProviderId, '2025-12-31')
        ]);

        setSnapshot(snapshotResponse.data.data);
        setDomains(domainsResponse.data.data);
      } else {
        setSnapshot(null);
        setDomains(null);
      }
    } catch (err) {
      console.error('Failed to fetch provider data:', err);
      setSnapshot(null);
      setDomains(null);
    }
  }, []);

  useEffect(() => {
    if (selectedOrganizationId) {
      fetchSnapshotForOrganization(selectedOrganizationId);
    }
  }, [selectedOrganizationId, fetchSnapshotForOrganization]);

  const handleOrganizationChange = useCallback((organizationId) => {
    setSelectedOrganizationId(organizationId);
  }, []);

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>Loading...</div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isUserAuthenticated && !passwordChangeRequired) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Show change password page if password change is required
  if (passwordChangeRequired) {
    return <ChangePassword onPasswordChanged={handlePasswordChanged} />;
  }

  // Show main app if authenticated
  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <Navbar user={user} onOrganizationChange={handleOrganizationChange} />
        <div className="app-container">
          <Sidebar onToggleCollapse={setIsSidebarCollapsed} />
          <div className={`main-content ${isSidebarCollapsed ? 'collapsed' : ''}`}>
            <Routes>
              <Route path="/" element={<Navigate to="/performance" replace />} />
              <Route path="/performance" element={<PerformanceCommandCenter snapshot={snapshot} domains={domains} />} />
              <Route path="/population" element={<PopulationRiskIntelligence snapshot={snapshot} />} />
              <Route path="/quality" element={<QualityAccessImprovement snapshot={snapshot} />} />
              <Route path="/cost" element={<CostUtilizationControl snapshot={snapshot} />} />
              <Route path="/benchmarks" element={<BenchmarksTrustCenter snapshot={snapshot} />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
