import React, { useState, useEffect, useCallback } from 'react';
import { generateFlashcards } from '../lib/gemini';
import MagicLoader from './MagicLoader';
import './LearningComponent.css';

const LearningComponent = ({ topicsToLearn, onComplete, onBack }) => {
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studiedCards, setStudiedCards] = useState(new Set());

  const currentTopic = topicsToLearn[currentTopicIndex];

  const loadFlashcards = useCallback(async () => {
    setLoading(true);
    setIsFlipped(false);
    setCurrentCardIndex(0);
    setStudiedCards(new Set());
    
    try {
      const generatedFlashcards = await generateFlashcards(currentTopic);
      setFlashcards(generatedFlashcards);
    } catch (error) {
      console.error('Error generating flashcards:', error);
    } finally {
      setLoading(false);
    }
  }, [currentTopic]);

  useEffect(() => {
    if (topicsToLearn.length > 0) {
      loadFlashcards();
    }
  }, [topicsToLearn.length, loadFlashcards]);

  const handleCardClick = () => {
    if (!isFlipped) {
      setIsFlipped(true);
      setStudiedCards(prev => new Set([...prev, currentCardIndex]));
    }
  };

  const handleNextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFinishTopic = () => {
    if (currentTopicIndex < topicsToLearn.length - 1) {
      // Move to next topic
      setCurrentTopicIndex(currentTopicIndex + 1);
    } else {
      // All topics completed
      onComplete();
    }
  };

  const handleRestartTopic = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setStudiedCards(new Set());
  };

  const allCardsStudied = studiedCards.size === flashcards.length;
  const progress = flashcards.length > 0 ? (studiedCards.size / flashcards.length) * 100 : 0;

  if (topicsToLearn.length === 0) {
    return (
      <div className="learning-container">
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

        <h1 className="title">Grasphopper</h1>
        <div className="completion-message">
          <h2>🎉 Congratulations!</h2>
          <p>You have successfully completed all the learning modules. You're now ready to proceed with the main topic!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="learning-container">
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

      <h1 className="title">Grasphopper</h1>

      <div className="learning-content">
        <div className="topic-header">
          <h2>Prerequisites • {currentTopic}</h2>
          <div className="progress-info">
            Topic {currentTopicIndex + 1} of {topicsToLearn.length}
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <MagicLoader size={120} particleCount={2} speed={1.2} hueRange={[200, 280]} />
            <p>Generating flashcards...</p>
          </div>
        ) : (
          <div className="flashcard-container">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              <div className="progress-text">
                {studiedCards.size} of {flashcards.length} cards studied
              </div>
            </div>

            <div className="flashcard-wrapper">
              <div 
                className={`flashcard ${isFlipped ? 'flipped' : ''}`}
                onClick={handleCardClick}
              >
                <div className="flashcard-front">
                  <div className="card-number">
                    {currentCardIndex + 1} / {flashcards.length}
                  </div>
                  <div className="card-content">
                    <h3>{flashcards[currentCardIndex]?.question}</h3>
                    <div className="tap-instruction">
                      {!isFlipped && <span>👆 Tap to reveal answer</span>}
                    </div>
                  </div>
                </div>
                <div className="flashcard-back">
                  <div className="card-number">
                    {currentCardIndex + 1} / {flashcards.length}
                  </div>
                  <div className="card-content">
                    <div className="answer-content">
                      {flashcards[currentCardIndex]?.answer}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flashcard-navigation">
              <button 
                className="nav-button" 
                onClick={handlePrevCard} 
                disabled={currentCardIndex === 0}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15,18 9,12 15,6"></polyline>
                </svg>
                Previous
              </button>
              
              <div className="card-indicators">
                {flashcards.map((_, index) => (
                  <div
                    key={index}
                    className={`indicator ${index === currentCardIndex ? 'active' : ''} ${studiedCards.has(index) ? 'studied' : ''}`}
                    onClick={() => {
                      setCurrentCardIndex(index);
                      setIsFlipped(false);
                    }}
                  >
                    {studiedCards.has(index) && <span className="tick-mark">✓</span>}
                  </div>
                ))}
              </div>
              
              <button 
                className="nav-button" 
                onClick={handleNextCard} 
                disabled={currentCardIndex === flashcards.length - 1}
              >
                Next
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </button>
            </div>

            <div className="topic-actions">
              {allCardsStudied ? (
                <div className="completion-actions">
                  <div className="completion-message">
                    <span className="check-icon">✅</span>
                    <span>Topic completed! All flashcards studied.</span>
                  </div>
                  <div className="action-buttons">
                    <button onClick={handleRestartTopic} className="action-button secondary">
                      Review Again
                    </button>
                    <button onClick={handleFinishTopic} className="action-button primary">
                      {currentTopicIndex < topicsToLearn.length - 1 ? 'Next Topic' : 'Complete Learning'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="study-progress">
                  <p>Study all flashcards to complete this topic</p>
                  <div className="quick-actions">
                    <button onClick={handleRestartTopic} className="action-button secondary">
                      Restart Topic
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningComponent;
