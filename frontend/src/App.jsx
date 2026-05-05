import React, { useState, useEffect } from 'react';
import './App.css';
import { healthAPI, providersAPI } from './api';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

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
    <div className="app-wrapper">
      <Navbar isAdmin={true} onOrganizationChange={handleOrganizationChange} />
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          {snapshot && (
            <div className="snapshot-container">
              <div className="snapshot-metrics">
                <div className="metric-item">
                  <div className="metric-label">Provider Name</div>
                  <div className="metric-value">{snapshot.provider_name}</div>
                </div>

                <div className="metric-item">
                  <div className="metric-label">Reporting Period</div>
                  <div className="metric-value">{snapshot.rolling_window_display}</div>
                </div>

                <div className="metric-item">
                  <div className="metric-label">Attributed Members (Current Month)</div>
                  <div className="metric-value">{snapshot.attributed_members_current?.toLocaleString()}</div>
                </div>

                <div className="metric-item">
                  <div className="metric-label">Net Member Change (vs Prior 12 Mo)</div>
                  <div className="metric-value">
                    <span className={snapshot.net_member_change >= 0 ? 'change-positive' : 'change-negative'}>
                      {snapshot.net_member_change > 0 ? '+' : ''}{snapshot.net_member_change}
                    </span>
                  </div>
                </div>

                <div className="metric-item">
                  <div className="metric-label">Avg Risk Score (R12)</div>
                  <div className="metric-value">{snapshot.avg_risk_score_r12}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
