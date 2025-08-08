import React, { useState } from 'react';
import Navigation from './components/Navigation';
import Home from './components/Home';
import Alerts from './components/Alerts';
import CurrentState from './components/CurrentState';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('home');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return <Home />;
      case 'alerts':
        return <Alerts />;
      case 'current-state':
        return <CurrentState />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="App">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main-content">
        {renderActiveTab()}
      </main>
    </div>
  );
}

export default App;
