import React, { useState } from 'react';
import { generatePrerequisites } from '../lib/gemini';
import Evaluation from './Evaluation';
import LearningComponent from './LearningComponent';
import './LearningSession.css';

const LearningSession = ({ topic: initialTopic = '', onBack }) => {
  const [topic, setTopic] = useState(initialTopic);
  const [prerequisites, setPrerequisites] = useState([]);
  const [selectedPrerequisites, setSelectedPrerequisites] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('prerequisites'); // 'prerequisites', 'evaluation', 'learning', 'final-evaluation', 'completed'
  const [topicsToLearn, setTopicsToLearn] = useState([]);
  // const [evaluationResults, setEvaluationResults] = useState(null); // Not used currently
  const [finalEvaluationResults, setFinalEvaluationResults] = useState(null);

  // Auto-submit if we have an initial topic
  React.useEffect(() => {
    const autoSubmit = async () => {
      if (initialTopic && initialTopic.trim()) {
        setLoading(true);
        try {
          const prerequisites = await generatePrerequisites(initialTopic);
          setPrerequisites(prerequisites);
          setSelectedPrerequisites(new Set());
        } catch (error) {
          console.error('Error fetching prerequisites:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    autoSubmit();
  }, [initialTopic]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    setLoading(true);
    try {
      const prerequisites = await generatePrerequisites(topic);
      setPrerequisites(prerequisites);
      setSelectedPrerequisites(new Set()); // Reset selections
    } catch (error) {
      console.error('Error fetching prerequisites:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelected = (prerequisite) => {
    setSelectedPrerequisites((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(prerequisite)) {
        newSelected.delete(prerequisite);
      } else {
        newSelected.add(prerequisite);
      }
      return newSelected;
    });
  };

  const selectAll = () => {
    setSelectedPrerequisites(new Set(prerequisites));
  };

  const handleEvaluate = () => {
    if (selectedPrerequisites.size === 0) {
      // No prerequisites selected, skip evaluation and go directly to learning
      setTopicsToLearn(prerequisites);
      setCurrentPhase('learning');
    } else {
      // Start evaluation phase
      setCurrentPhase('evaluation');
    }
  };

  const handleEvaluationComplete = (failedTopics, results) => {
    setTopicsToLearn([...failedTopics, ...prerequisites.filter(topic => !selectedPrerequisites.has(topic))]);
    // setEvaluationResults(results); // Not storing initial evaluation results currently
    setCurrentPhase('learning');
  };

  const handleBackFromEvaluation = () => {
    setCurrentPhase('prerequisites');
  };

  const handleLearningComplete = () => {
    if (topicsToLearn.length > 0) {
      // Start final evaluation on learned topics
      setCurrentPhase('final-evaluation');
    } else {
      // No topics to learn, mark as completed
      setCurrentPhase('completed');
    }
  };

  const handleFinalEvaluationComplete = (failedTopics, results) => {
    setFinalEvaluationResults(results);
    if (failedTopics.length > 0) {
      // Some topics still failed, need to learn them again
      setTopicsToLearn(failedTopics);
      setCurrentPhase('learning');
    } else {
      // All topics passed, mark as completed
      setCurrentPhase('completed');
    }
  };

  const handleBackFromFinalEvaluation = () => {
    setCurrentPhase('learning');
  };

  // Render evaluation phase
  if (currentPhase === 'evaluation') {
    return (
      <Evaluation
        selectedPrerequisites={selectedPrerequisites}
        onEvaluationComplete={handleEvaluationComplete}
        onBack={handleBackFromEvaluation}
      />
    );
  }

  // Render learning phase
  if (currentPhase === 'learning') {
    return (
      <LearningComponent
        topicsToLearn={topicsToLearn}
        onComplete={handleLearningComplete}
        onBack={onBack}
      />
    );
  }

  // Render final evaluation phase
  if (currentPhase === 'final-evaluation') {
    return (
      <Evaluation
        selectedPrerequisites={new Set(topicsToLearn)}
        onEvaluationComplete={handleFinalEvaluationComplete}
        onBack={handleBackFromFinalEvaluation}
      />
    );
  }

  // Render completion phase
  if (currentPhase === 'completed') {
    return (
      <div className="learning-session-container">
        <div className="nav-menu" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </div>
        
        <div className="nav-profile">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>

        <h1 className="title">Grasphoffer</h1>

        <div className="completion-section">
          <div className="completion-message">
            <h2>🎉 Congratulations!</h2>
            <p>You have successfully completed all prerequisite learning and evaluations!</p>
            <p>You're now ready to learn the main topic: <strong>{topic}</strong></p>
          </div>
          
          {finalEvaluationResults && (
            <div className="final-results-summary">
              <h3>Final Evaluation Summary:</h3>
              <div className="results-grid">
                {Object.keys(finalEvaluationResults).map((topicName, index) => {
                  const result = finalEvaluationResults[topicName];
                  return (
                    <div key={index} className={`result-card ${result.passed ? 'passed' : 'failed'}`}>
                      <h4>{topicName}</h4>
                      <div className="score">
                        {result.correct}/{result.total}
                      </div>
                      <div className="status">
                        ✓ Mastered
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render prerequisites phase (default)
  return (
    <div className="learning-session-container">
      {/* Navigation Icons */}
      <div className="nav-menu" onClick={onBack}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </div>
      
      <div className="nav-profile">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>

      <h1 className="title">Grasphoffer</h1>

      <form className="topic-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="What would you like to learn today?"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="topic-input"
        />
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? (
            <div className="loading-spinner-small"></div>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          )}
        </button>
      </form>

      {loading && (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Analyzing topic and generating prerequisites...</p>
        </div>
      )}

      {!loading && prerequisites.length > 0 && (
        <div className="prerequisites-section">
          <h2>Prerequisites :</h2>
          <div className="prerequisites-list">
            {prerequisites.map((prerequisite, index) => (
              <div
                key={index}
                className={`prerequisite-item ${selectedPrerequisites.has(
                  prerequisite
                ) ? 'selected' : ''}`}
                onClick={() => toggleSelected(prerequisite)}
              >
                {prerequisite}
              </div>
            ))}
          </div>
          <div className="actions">
            <button onClick={selectAll} className="action-button">
              Accept All
            </button>
            <button onClick={handleEvaluate} className="action-button">Evaluate</button>
          </div>
          <p className="instructions">
            Please select relevant topics you are already familiar with, then
            click Evaluate.
          </p>
        </div>
      )}
    </div>
  );
};

export default LearningSession;
