import React, { useState } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import LearningSession from './components/LearningSession';

// Loading component
const Loading = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Loading...</p>
  </div>
);

// Main App Content
const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [learningTopic, setLearningTopic] = useState('');

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Auth />;
  }

  const handleStartLearning = (topic) => {
    setLearningTopic(topic);
    setCurrentView('learning');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setLearningTopic('');
  };

  if (currentView === 'learning') {
    return <LearningSession topic={learningTopic} onBack={handleBackToDashboard} />;
  }

  return <Dashboard onStartLearning={handleStartLearning} />;
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
