import React from 'react';
import './SessionDebugInfo.css';
import boltIcon from '../assets/icons/Lightning-bolt.PNG';

/**
 * Debug component to show session state information
 * Only shown in development mode
 */
const SessionDebugInfo = ({
  sessionId,
  currentPhase,
  currentCardIndex,
  studiedCards,
  currentQuestionIndex,
  answers,
  resumeData
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isOpen) {
    return (
      <div className="session-debug-toggle" onClick={() => setIsOpen(true)} title="Show Debug Info">
        <img src={boltIcon} alt="Debug" style={{ width: '24px', height: '24px' }} />
      </div>
    );
  }

  return (
    <div className="session-debug-info">
      <div className="debug-header">
        <h4><img src={boltIcon} alt="Debug" style={{ width: '24px', height: '24px', verticalAlign: 'middle' }} /> Debug Info</h4>
        <button className="close-debug" onClick={() => setIsOpen(false)}>×</button>
      </div>
      <div className="debug-section">
        <strong>Session ID:</strong> {sessionId || 'Not set'}
      </div>
      <div className="debug-section">
        <strong>Current Phase:</strong> {currentPhase}
      </div>
      <div className="debug-section">
        <strong>Current Card Index:</strong> {currentCardIndex}
      </div>
      <div className="debug-section">
        <strong>Studied Cards:</strong> {Array.from(studiedCards || []).join(', ') || 'None'}
      </div>
      <div className="debug-section">
        <strong>Current Question Index:</strong> {currentQuestionIndex}
      </div>
      <div className="debug-section">
        <strong>Answers Count:</strong> {Object.keys(answers || {}).length}
      </div>
      {resumeData && (
        <div className="debug-section">
          <strong>Resume Data:</strong>
          <pre>{JSON.stringify(resumeData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default SessionDebugInfo;
