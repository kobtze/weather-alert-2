import React from 'react';
import './Navigation.css';

const Navigation = ({ activeTab, onTabChange }) => {
  return (
    <nav className="navigation">
      <div className="nav-container">
        <h1 className="nav-title">🌤️ Weather Alert System</h1>
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => onTabChange('home')}
          >
            🏠 Home
          </button>
          <button 
            className={`nav-tab ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => onTabChange('alerts')}
          >
            ⚠️ Alerts
          </button>
          <button 
            className={`nav-tab ${activeTab === 'current-state' ? 'active' : ''}`}
            onClick={() => onTabChange('current-state')}
          >
            📊 Current State
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

