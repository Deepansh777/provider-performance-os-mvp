import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { providersAPI } from './api';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import PerformanceCommandCenter from './pages/PerformanceCommandCenter';
import PopulationRiskIntelligence from './pages/PopulationRiskIntelligence';
import QualityAccessImprovement from './pages/QualityAccessImprovement';
import CostUtilizationControl from './pages/CostUtilizationControl';
import BenchmarksTrustCenter from './pages/BenchmarksTrustCenter';

function App() {
  const [snapshot, setSnapshot] = useState(null);
  const [domains, setDomains] = useState(null);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <Navbar isAdmin={true} onOrganizationChange={handleOrganizationChange} />
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
