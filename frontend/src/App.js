import React, { useState, useEffect } from 'react';
import './App.css';
import { healthAPI } from './api';

function App() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHealth();
  }, []);

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

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Health Check Dashboard</h1>
      </header>

      <main className="app-main">
        {loading && <div className="status">Loading...</div>}

        {error && (
          <div className="status error">
            <h2>❌ Error</h2>
            <p>{error}</p>
            <button onClick={fetchHealth}>Retry</button>
          </div>
        )}

        {health && !loading && (
          <div className="status success">
            <h2>✅ System Healthy</h2>
            <div className="health-details">
              <p><strong>Status:</strong> {health.status}</p>
              <p><strong>Version:</strong> {health.version}</p>
            </div>
            <button onClick={fetchHealth}>Refresh</button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
