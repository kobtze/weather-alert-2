import React, { useState, useEffect } from 'react';
import './CurrentState.css';

const CurrentState = () => {
  const [alertStatus, setAlertStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlertStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/alerts');
      if (!response.ok) {
        throw new Error('Failed to fetch alert status');
      }
      const data = await response.json();
      setAlertStatus(data.alerts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAlertStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (isTriggered) => {
    return isTriggered ? '🔴' : '🟢';
  };

  const getStatusText = (isTriggered) => {
    return isTriggered ? 'TRIGGERED' : 'Normal';
  };

  const getStatusClass = (isTriggered) => {
    return isTriggered ? 'triggered' : 'normal';
  };

  if (loading) {
    return (
      <div className="current-state">
        <div className="current-state-container">
          <div className="loading">Loading current state...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="current-state">
      <div className="current-state-container">
        <div className="current-state-header">
          <h2>Current Alert Status</h2>
          <button 
            className="refresh-btn"
            onClick={fetchAlertStatus}
          >
            🔄 Refresh
          </button>
        </div>

        {error && (
          <div className="error-message">
            Error: {error}
          </div>
        )}

        <div className="status-summary">
          <div className="summary-card">
            <h3>Total Alerts</h3>
            <p className="summary-number">{alertStatus.length}</p>
          </div>
          <div className="summary-card">
            <h3>Triggered</h3>
            <p className="summary-number triggered">
              {alertStatus.filter(alert => alert.is_triggered).length}
            </p>
          </div>
          <div className="summary-card">
            <h3>Normal</h3>
            <p className="summary-number normal">
              {alertStatus.filter(alert => !alert.is_triggered).length}
            </p>
          </div>
        </div>

        <div className="alerts-status-list">
          {alertStatus.length === 0 ? (
            <div className="no-status">
              <p>No alerts found. Create some alerts first!</p>
            </div>
          ) : (
            alertStatus.map(alert => (
              <div key={alert.id} className={`status-card ${getStatusClass(alert.is_triggered)}`}>
                <div className="status-icon">
                  {getStatusIcon(alert.is_triggered)}
                </div>
                <div className="status-info">
                  <h3>{alert.description}</h3>
                  <p><strong>Location:</strong> {alert.lat}, {alert.lon}</p>
                  <p><strong>Condition:</strong> {alert.parameter} {alert.operator} {alert.threshold}</p>
                  <p><strong>Current Value:</strong> {alert.current_value}</p>
                  <p><strong>Status:</strong> <span className={getStatusClass(alert.is_triggered)}>{getStatusText(alert.is_triggered)}</span></p>
                  {alert.checked_at && (
                    <p><strong>Last Checked:</strong> {new Date(alert.checked_at).toLocaleString()}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="auto-refresh-info">
          <p>💡 Status automatically refreshes every 30 seconds</p>
        </div>
      </div>
    </div>
  );
};

export default CurrentState;

