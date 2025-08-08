import React, { useState, useEffect } from 'react';
import AlertForm from './AlertForm';
import './Alerts.css';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/alerts');
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAlert = async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/alerts/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to delete alert');
      }
      await fetchAlerts(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleAlertCreated = () => {
    setShowForm(false);
    fetchAlerts(); // Refresh the list
  };

  if (loading) {
    return (
      <div className="alerts">
        <div className="alerts-container">
          <div className="loading">Loading alerts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="alerts">
      <div className="alerts-container">
        <div className="alerts-header">
          <h2>Weather Alerts</h2>
          <button 
            className="create-alert-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '+ Create New Alert'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            Error: {error}
          </div>
        )}

        {showForm && (
          <AlertForm onAlertCreated={handleAlertCreated} />
        )}

        <div className="alerts-list">
          {alerts.length === 0 ? (
            <div className="no-alerts">
              <p>No alerts created yet. Create your first weather alert!</p>
            </div>
          ) : (
            alerts.map(alert => (
              <div key={alert.id} className="alert-card">
                <div className="alert-info">
                  <h3>{alert.description}</h3>
                  <p><strong>Location:</strong> {alert.lat}, {alert.lon}</p>
                  <p><strong>Condition:</strong> {alert.parameter} {alert.operator} {alert.threshold}</p>
                  <p><strong>Created:</strong> {new Date(alert.created_at).toLocaleString()}</p>
                </div>
                <div className="alert-actions">
                  <button 
                    className="delete-btn"
                    onClick={() => deleteAlert(alert.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerts;

