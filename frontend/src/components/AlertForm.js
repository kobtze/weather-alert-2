import React, { useState } from 'react';
import './AlertForm.css';

const AlertForm = ({ onAlertCreated }) => {
  const [formData, setFormData] = useState({
    lat: '',
    lon: '',
    parameter: 'temperature',
    operator: '>',
    threshold: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'lat' || name === 'lon' || name === 'threshold' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create alert');
      }

      // Reset form
      setFormData({
        lat: '',
        lon: '',
        parameter: 'temperature',
        operator: '>',
        threshold: '',
        description: ''
      });

      onAlertCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="alert-form-container">
      <form className="alert-form" onSubmit={handleSubmit}>
        <h3>Create New Weather Alert</h3>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="lat">Latitude</label>
            <input
              type="number"
              id="lat"
              name="lat"
              value={formData.lat}
              onChange={handleChange}
              step="any"
              required
              placeholder="e.g., 40.7128"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="lon">Longitude</label>
            <input
              type="number"
              id="lon"
              name="lon"
              value={formData.lon}
              onChange={handleChange}
              step="any"
              required
              placeholder="e.g., -74.0060"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="parameter">Weather Parameter</label>
            <select
              id="parameter"
              name="parameter"
              value={formData.parameter}
              onChange={handleChange}
              required
            >
              <option value="temperature">Temperature</option>
              <option value="humidity">Humidity</option>
              <option value="windSpeed">Wind Speed</option>
              <option value="precipitation">Precipitation</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="operator">Operator</label>
            <select
              id="operator"
              name="operator"
              value={formData.operator}
              onChange={handleChange}
              required
            >
              <option value=">">Greater than (&gt;)</option>
              <option value="<">Less than (&lt;)</option>
              <option value="=">Equals (&equals;)</option>
              <option value=">=">Greater than or equal (&ge;)</option>
              <option value="<=">Less than or equal (&le;)</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="threshold">Threshold</label>
            <input
              type="number"
              id="threshold"
              name="threshold"
              value={formData.threshold}
              onChange={handleChange}
              step="any"
              required
              placeholder="e.g., 30"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            placeholder="e.g., High temperature alert for NYC"
          />
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Alert'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AlertForm;

