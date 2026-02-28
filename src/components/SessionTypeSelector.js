import React from 'react';
import './SessionTypeSelector.css';
import boltIcon from '../assets/icons/Lightning-bolt.PNG';
import treeIcon from '../assets/icons/knowledge-tree-icon.PNG';
import targetIcon from '../assets/icons/Target-board.PNG';
import checkIcon from '../assets/icons/green-tick.PNG';

const SessionTypeSelector = ({ selectedType, onTypeChange, disabled = false }) => {
  const sessionTypes = [
    {
      id: 'fast',
      name: 'Fast Learning',
      icon: <img src={boltIcon} alt="Fast" style={{ width: '24px', height: '24px' }} />,
      description: 'Quick session with 10 flashcards and 15 MCQs',
      features: [
        'No prerequisites evaluation',
        '10 focused flashcards',
        '15 assessment questions',
        'Quick completion (~15 mins)'
      ],
      color: '#f59e0b',
      disabled: true
    },
    {
      id: 'depth',
      name: 'Depth Learning',
      icon: <img src={treeIcon} alt="Depth" style={{ width: '24px', height: '24px' }} />,
      description: 'Comprehensive tree-based learning approach',
      features: [
        'Prerequisites analysis',
        'Tree-based learning path',
        'Multiple evaluation cycles',
        'Thorough mastery (~45 mins)'
      ],
      color: '#10b981',
      disabled: true
    },
    {
      id: 'exam-drill',
      name: 'Exam Drill',
      icon: <img src={targetIcon} alt="Exam Drill" style={{ width: '24px', height: '24px' }} />,
      description: 'Practice with real question papers',
      features: [
        'Upload question papers (PDFs)',
        'Timed drill sessions',
        'Answer evaluation & scoring',
        'Targeted exam preparation'
      ],
      color: '#8b5cf6',
      disabled: false
    }
  ];

  return (
    <div className="session-type-selector">


      <div className="session-types-grid">
        {sessionTypes.map((type) => (
          <div
            key={type.id}
            className={`session-type-card ${selectedType === type.id ? 'selected' : ''} ${type.disabled || disabled ? 'disabled' : ''}`}
            onClick={() => !type.disabled && !disabled && onTypeChange(type.id)}
            style={{ '--accent-color': type.color }}
          >
            <div className="session-type-header">
              <div className="session-type-icon">{type.icon}</div>
              <div className="session-type-info">
                <h4>{type.name}</h4>
                <p>{type.description}</p>
              </div>
              <div className="selection-indicator">
                {selectedType === type.id && <div className="check-mark"><img src={checkIcon} alt="Selected" style={{ width: '16px', height: '16px' }} /></div>}
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
