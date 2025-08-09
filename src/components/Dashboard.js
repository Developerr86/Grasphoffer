import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = ({ onStartLearning }) => {
  const { user, signOut } = useAuth();
  const [topic, setTopic] = useState('');

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Grasphoffer</h1>
        <div className="user-info">
          <span className="user-email">{user?.email}</span>
          <button 
            onClick={signOut}
            className="signout-button"
          >
            Sign Out
          </button>
        </div>
      </header>
      
      <main className="dashboard-main">
        <div className="welcome-section">
          <h2>Welcome to your learning journey!</h2>
          <p>Start by entering a topic you'd like to learn about.</p>
        </div>
        
        <div className="topic-input-section">
          <div className="input-card">
            <h3>What would you like to learn today?</h3>
            <div className="topic-input-group">
              <input
                type="text"
                placeholder="Enter a topic (e.g., Machine Learning, React.js, Quantum Physics)"
                className="topic-input"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
              <button 
                className="start-learning-button"
                onClick={() => onStartLearning && onStartLearning(topic)}
                disabled={!topic.trim()}
              >
                Start Learning
              </button>
            </div>
          </div>
        </div>
        
        <div className="recent-sessions">
          <h3>Recent Learning Sessions</h3>
          <div className="sessions-grid">
            <div className="session-card">
              <h4>No sessions yet</h4>
              <p>Start your first learning session above!</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
