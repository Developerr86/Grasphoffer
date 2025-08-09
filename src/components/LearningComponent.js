import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { generateSubtopics, generateSubtopicContent, rephraseContent, answerQuestion } from '../lib/gemini';
import './LearningComponent.css';

const LearningComponent = ({ topicsToLearn, onComplete, onBack }) => {
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [subtopics, setSubtopics] = useState([]);
  const [currentSubtopicIndex, setCurrentSubtopicIndex] = useState(0);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const currentTopic = topicsToLearn[currentTopicIndex];
  // const currentSubtopic = subtopics[currentSubtopicIndex]; // Not used currently

  useEffect(() => {
    if (topicsToLearn.length > 0) {
      loadTopicSubtopics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTopicIndex, topicsToLearn]);

  const loadTopicSubtopics = async () => {
    setLoading(true);
    setShowOptions(false);
    try {
      const generatedSubtopics = await generateSubtopics(currentTopic);
      setSubtopics(generatedSubtopics);
      setCurrentSubtopicIndex(0);
      loadContentForSubtopic(generatedSubtopics[0]);
    } catch (error) {
      console.error('Error generating subtopics:', error);
    }
  };

  const loadContentForSubtopic = async (subtopic) => {
    setLoading(true);
    try {
      const generatedContent = await generateSubtopicContent(subtopic);
      setContent(generatedContent);
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGotIt = () => {
    setShowOptions(false);
    
    if (currentSubtopicIndex < subtopics.length - 1) {
      // Move to next subtopic
      setCurrentSubtopicIndex(currentSubtopicIndex + 1);
      loadContentForSubtopic(subtopics[currentSubtopicIndex + 1]);
    } else if (currentTopicIndex < topicsToLearn.length - 1) {
      // Move to next topic
      setCurrentTopicIndex(currentTopicIndex + 1);
    } else {
      // All topics and subtopics covered - trigger evaluation
      onComplete();
    }
  };

  const handleDidntUnderstand = () => {
    setShowOptions(true);
  };

  const handleRephrase = async () => {
    setLoading(true);
    setShowOptions(false);
    try {
      const rephrasedContent = await rephraseContent(content);
      setContent(rephrasedContent);
    } catch (error) {
      console.error('Error rephrasing content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = () => {
    setShowQuestionDialog(true);
    setShowOptions(false);
  };

  const handleSubmitQuestion = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    try {
      const generatedAnswer = await answerQuestion(question);
      setAnswer(generatedAnswer);
    } catch (error) {
      console.error('Error answering question:', error);
      setAnswer("I'm sorry, I couldn't generate an answer to your question at the moment.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseQuestion = () => {
    setShowQuestionDialog(false);
    setQuestion('');
    setAnswer('');
  };

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

        <h1 className="title">Grasphoffer</h1>
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

      <h1 className="title">Grasphoffer</h1>

      <div className="learning-content">
        <div className="topic-header">
          <h2>Prerequisites • {currentTopic}</h2>
        </div>

        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Generating content...</p>
          </div>
        ) : (
          <div className="content-block">
            <div className="content-text">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
            
            <div className="content-actions">
              <button onClick={handleGotIt} className="action-button primary">
                Got it
              </button>
              <button onClick={handleDidntUnderstand} className="action-button">
                Didn't Understand
              </button>
              <button onClick={handleRephrase} className="action-button">
                Rephrase
              </button>
            </div>

            {showOptions && (
              <div className="understanding-options">
                <p>What would you like to do?</p>
                <div className="option-buttons">
                  <button onClick={handleAskQuestion} className="option-button">
                    Ask a Question
                  </button>
                  <button className="option-button" disabled>
                    Learn More
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showQuestionDialog && (
        <div className="question-dialog-overlay">
          <div className="question-dialog">
            <h3>Ask a Question</h3>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to know about this topic?"
              rows={4}
            />
            <div className="dialog-actions">
              <button onClick={handleSubmitQuestion} disabled={!question.trim() || loading}>
                {loading ? 'Getting Answer...' : 'Submit Question'}
              </button>
              <button onClick={handleCloseQuestion}>Cancel</button>
            </div>
            {answer && (
              <div className="answer-section">
                <h4>Answer:</h4>
                <div className="answer-content">
                  <ReactMarkdown>{answer}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningComponent;
