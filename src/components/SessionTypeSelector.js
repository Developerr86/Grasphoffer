import React from 'react';
import './SessionTypeSelector.css';

const SessionTypeSelector = ({ selectedType, onTypeChange, disabled = false }) => {
  const sessionTypes = [
    {
      id: 'fast',
      name: 'Fast Learning',
      icon: '⚡',
      description: 'Quick session with 10 flashcards and 15 MCQs',
      features: [
        'No prerequisites evaluation',
        '10 focused flashcards',
        '15 assessment questions',
        'Quick completion (~15 mins)'
      ],
      color: '#f59e0b'
    },
    {
      id: 'depth',
      name: 'Depth Learning',
      icon: '🌳',
      description: 'Comprehensive tree-based learning approach',
      features: [
        'Prerequisites analysis',
        'Tree-based learning path',
        'Multiple evaluation cycles',
        'Thorough mastery (~45 mins)'
      ],
      color: '#10b981'
    }
  ];

  return (
    <div className="session-type-selector">
      <div className="selector-header">
        <h3>Choose Your Learning Style</h3>
        <p>Select the type of learning session that fits your needs</p>
      </div>
      
      <div className="session-types-grid">
        {sessionTypes.map((type) => (
          <div
            key={type.id}
            className={`session-type-card ${selectedType === type.id ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && onTypeChange(type.id)}
            style={{ '--accent-color': type.color }}
          >
            <div className="session-type-header">
              <div className="session-type-icon">{type.icon}</div>
              <div className="session-type-info">
                <h4>{type.name}</h4>
                <p>{type.description}</p>
              </div>
              <div className="selection-indicator">
                {selectedType === type.id && <div className="check-mark">✓</div>}
              </div>
            </div>
            
            <div className="session-type-features">
              <ul>
                {type.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
      
      <div className="selection-summary">
        {selectedType && (
          <div className="selected-type-summary">
            <span className="summary-icon">
              {sessionTypes.find(t => t.id === selectedType)?.icon}
            </span>
            <span className="summary-text">
              You've selected <strong>{sessionTypes.find(t => t.id === selectedType)?.name}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionTypeSelector;
