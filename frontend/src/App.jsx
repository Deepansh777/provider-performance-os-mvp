import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { healthAPI, providersAPI } from './api';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import PerformanceCommandCenter from './pages/PerformanceCommandCenter';
import PopulationRiskIntelligence from './pages/PopulationRiskIntelligence';
import QualityAccessImprovement from './pages/QualityAccessImprovement';
import CostUtilizationControl from './pages/CostUtilizationControl';
import BenchmarksTrustCenter from './pages/BenchmarksTrustCenter';

function App() {
  const [health, setHealth] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(null);

  useEffect(() => {
    fetchHealth();
  }, []);

  useEffect(() => {
    if (selectedOrganizationId) {
      fetchSnapshotForOrganization(selectedOrganizationId);
    }
  }, [selectedOrganizationId]);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const response = await healthAPI.getHealth();
      setHealth(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to connect to backend');
      console.error('Health check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSnapshotForOrganization = async (organizationId) => {
    try {
      // First, get all providers for this organization
      const providersResponse = await providersAPI.getAll(organizationId);

      if (providersResponse.data.success && providersResponse.data.data.length > 0) {
        // Get the first provider's ID
        const firstProviderId = providersResponse.data.data[0].id;

        // Fetch snapshot for the first provider, reporting period Dec-25
        const snapshotResponse = await providersAPI.getSnapshot(firstProviderId, '2025-12-31');
        setSnapshot(snapshotResponse.data.data);
      } else {
        setSnapshot(null);
      }
    } catch (err) {
      console.error('Failed to fetch provider snapshot:', err);
      setSnapshot(null);
    }
  };

  const handleOrganizationChange = (organizationId) => {
    setSelectedOrganizationId(organizationId);
  };

  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <Navbar isAdmin={true} onOrganizationChange={handleOrganizationChange} />
        <div className="app-container">
          <Sidebar />
          <div className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/performance" replace />} />
              <Route path="/performance" element={<PerformanceCommandCenter snapshot={snapshot} />} />
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
