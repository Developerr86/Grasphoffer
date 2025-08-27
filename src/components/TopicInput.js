import React, { useState } from 'react';
import './TopicInput.css';

const TopicInput = ({ onTopicSubmit, disabled = false }) => {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (topic.trim() && onTopicSubmit) {
      onTopicSubmit(topic.trim());
    }
  };

  return (
    <div className="topic-input-container">
      <div className="input-method-card">
        <div className="input-method-header">
          <div className="input-method-icon">📝</div>
          <h3>Enter a Topic</h3>
          <p>Type in what you want to learn about</p>
        </div>
        
        <form onSubmit={handleSubmit} className="topic-form">
          <div className="topic-input-group">
            <input
              type="text"
              placeholder="What would you like to learn today?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="topic-input-field"
              disabled={disabled}
            />
            <button 
              type="submit" 
              className="topic-submit-button"
              disabled={!topic.trim() || disabled}
            >
              Start Learning
            </button>
          </div>
        </form>
        
        <div className="topic-examples">
          <p>Examples:</p>
          <div className="example-topics">
            <button 
              className="example-topic"
              onClick={() => setTopic('Machine Learning')}
              disabled={disabled}
            >
              Machine Learning
            </button>
            <button 
              className="example-topic"
              onClick={() => setTopic('React Hooks')}
              disabled={disabled}
            >
              React Hooks
            </button>
            <button 
              className="example-topic"
              onClick={() => setTopic('Data Structures')}
              disabled={disabled}
            >
              Data Structures
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicInput;
