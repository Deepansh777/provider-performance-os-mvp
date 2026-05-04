import React, { useState, useEffect } from 'react';
import './App.css';
import { healthAPI } from './api';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

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
    <div className="app-wrapper">
      <Navbar isAdmin={true} />
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          {/* Main content area - dashboard will go here */}
        </div>
      </div>
    </div>
  );
}

export default App;
