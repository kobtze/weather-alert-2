import React, { useState, useEffect } from 'react';
import './Home.css';

const Home = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tel Aviv coordinates
  const TEL_AVIV_LAT = 32.0853;
  const TEL_AVIV_LON = 34.7818;

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/weather?lat=${TEL_AVIV_LAT}&lon=${TEL_AVIV_LON}`);
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      const data = await response.json();
      setWeatherData(data.weather);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);
  return (
    <div className="home">
      <div className="home-container">
        <div className="welcome-section">
          <h2>Welcome to Weather Alert System</h2>
          <p className="subtitle">Monitor weather conditions and get alerts when thresholds are exceeded</p>
        </div>

        <div className="weather-section">
          <h3>Current Weather in Tel Aviv</h3>
          {loading ? (
            <div className="weather-loading">Loading weather data...</div>
          ) : error ? (
            <div className="weather-error">
              Error loading weather data: {error}
            </div>
          ) : weatherData ? (
            <div className="weather-display">
              <div className="weather-metric">
                <div className="metric-icon">🌡️</div>
                <div className="metric-info">
                  <span className="metric-label">Temperature</span>
                  <span className="metric-value">{weatherData.temperature}°C</span>
                </div>
              </div>
              <div className="weather-metric">
                <div className="metric-icon">💧</div>
                <div className="metric-info">
                  <span className="metric-label">Humidity</span>
                  <span className="metric-value">{weatherData.humidity}%</span>
                </div>
              </div>
              <div className="weather-metric">
                <div className="metric-icon">💨</div>
                <div className="metric-info">
                  <span className="metric-label">Wind Speed</span>
                  <span className="metric-value">{weatherData.windSpeed} m/s</span>
                </div>
              </div>
              <div className="weather-metric">
                <div className="metric-icon">☁️</div>
                <div className="metric-info">
                  <span className="metric-label">Cloud Cover</span>
                  <span className="metric-value">{weatherData.cloudCover}%</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="quick-start">
          <h3>Quick Start</h3>
          <ol>
            <li>Go to the <strong>Alerts</strong> tab to create your first weather alert</li>
            <li>Set your location coordinates and weather parameters</li>
            <li>Choose your threshold and operator (e.g., temperature {'>'} 30°C)</li>
            <li>Monitor your alerts in the <strong>Current State</strong> tab</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Home;

