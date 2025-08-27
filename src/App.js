import React, { useState } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import DepthLearningSession from './components/DepthLearningSession';
import FastLearningSession from './components/FastLearningSession';
import Profile from './components/Profile';
import TheHopperPage from './components/TheHopperPage';
import MagicLoader from './components/MagicLoader';

// Loading component with dashboard theme
const Loading = () => (
  <div className="loading-container">
    <MagicLoader size={120} particleCount={2} speed={1.2} hueRange={[200, 280]} />
    <p>Loading...</p>
  </div>
);

// Main App Content
const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [learningData, setLearningData] = useState(null);
  const [profileViewKey, setProfileViewKey] = useState(0); // refresh signal for profile

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Auth />;
  }

  const handleStartLearning = (data) => {
    setLearningData(data);
    setCurrentView('learning');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setLearningData(null);
  };

  const handleOpenProfile = () => {
    setCurrentView('profile');
    // bump key to force refresh if needed
    setProfileViewKey(prev => prev + 1);
  };

  const handleOpenTheHopper = () => {
    setCurrentView('thehopper');
  };

  if (currentView === 'learning' && learningData) {
    if (learningData.type === 'fast') {
      return (
        <FastLearningSession
          topic={learningData.topic || 'Uploaded Content'}
          resumeData={learningData.resumeData}
          onBack={handleBackToDashboard}
          onOpenTheHopper={handleOpenTheHopper}
        />
      );
    } else if (learningData.type === 'depth') {
      return (
        <DepthLearningSession
          topic={learningData.topic || 'Uploaded Content'}
          resumeData={learningData.resumeData}
          onBack={handleBackToDashboard}
        />
      );
    }
  }

  if (currentView === 'profile') {
    return <Profile key={profileViewKey} onBack={handleBackToDashboard} />;
  }

  if (currentView === 'thehopper') {
    return <TheHopperPage onBack={handleBackToDashboard} />;
  }

  return <Dashboard onStartLearning={handleStartLearning} onOpenProfile={handleOpenProfile} onOpenTheHopper={handleOpenTheHopper} />;
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;
