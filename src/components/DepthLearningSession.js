import React from 'react';
import './DepthLearningSession.css';

const DepthLearningSession = ({ topic: initialTopic = '', onBack }) => {
  return (
    <div className="depth-learning-session-container">
      <div className="nav-menu" onClick={onBack}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </div>

      <div className="placeholder-content">
        <h1 className="title">Depth Learning</h1>
        {initialTopic && <div className="topic-display">Topic: {initialTopic}</div>}

        <div className="placeholder-message">
          <p>This learning mode is currently under development.</p>
        </div>

        <button className="exit-button" onClick={onBack}>
          Exit Session
        </button>
      </div>
    </div>
  );
};

export default DepthLearningSession;
