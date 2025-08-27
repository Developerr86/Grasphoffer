import React, { useState, useEffect } from 'react';
import { generateMCQQuestions, generateEvaluationReport } from '../lib/gemini';
import MagicLoader from './MagicLoader';
import './Evaluation.css';

const Evaluation = ({ selectedPrerequisites, onEvaluationComplete, onBack }) => {
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState(null);

  const prerequisitesArray = Array.from(selectedPrerequisites);
  const currentTopic = prerequisitesArray[currentTopicIndex];
  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (prerequisitesArray.length > 0) {
      loadQuestionsForCurrentTopic();
    }
  }, [currentTopicIndex]);

  const loadQuestionsForCurrentTopic = async () => {
    setLoading(true);
    try {
      const topic = prerequisitesArray[currentTopicIndex];
      const topicQuestions = await generateMCQQuestions(topic);
      setQuestions(topicQuestions);
      setCurrentQuestionIndex(0);
      setSelectedAnswer('');
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    // Save answer
    const questionKey = `${currentTopicIndex}-${currentQuestionIndex}`;
    const updatedAnswers = {
      ...answers,
      [questionKey]: {
        question: currentQuestion.question,
        selectedAnswer,
        correctAnswer: currentQuestion.correctAnswer,
        topic: currentTopic,
        isCorrect: selectedAnswer === currentQuestion.correctAnswer
      }
    };
    setAnswers(updatedAnswers);

    // Move to next question or topic
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
    } else if (currentTopicIndex < prerequisitesArray.length - 1) {
      setCurrentTopicIndex(currentTopicIndex + 1);
    } else {
      // All questions completed - pass the updated answers to the completion function
      completeEvaluationWithAnswers(updatedAnswers);
    }
  };

  const completeEvaluationWithAnswers = async (finalAnswers) => {
    setLoading(true);
    
    // Calculate results using the final answers
    const results = {};
    prerequisitesArray.forEach((topic, topicIndex) => {
      const topicAnswers = Object.keys(finalAnswers)
        .filter(key => key.startsWith(`${topicIndex}-`))
        .map(key => finalAnswers[key]);
      
      const correctAnswers = topicAnswers.filter(answer => answer.isCorrect).length;
      const totalQuestions = 5; // As per requirement
      const passed = correctAnswers >= 4; // Need 4 out of 5 correct
      
      results[topic] = {
        correct: correctAnswers,
        total: totalQuestions,
        passed,
        questions: topicAnswers
      };
    });

    setEvaluationResults(results);

    // Generate AI report
    try {
      const aiReport = await generateEvaluationReport(results, prerequisitesArray);
      setReport(aiReport);
    } catch (error) {
      console.error('Error generating report:', error);
      setReport({
        remark: "Evaluation completed successfully. Please review your results above.",
        recommendations: []
      });
    }

    setLoading(false);
    setShowResults(true);
  };

  const completeEvaluation = async () => {
    setLoading(true);
    
    // Calculate results
    const results = {};
    prerequisitesArray.forEach((topic, topicIndex) => {
      const topicAnswers = Object.keys(answers)
        .filter(key => key.startsWith(`${topicIndex}-`))
        .map(key => answers[key]);
      
      const correctAnswers = topicAnswers.filter(answer => answer.isCorrect).length;
      const totalQuestions = 5; // As per requirement
      const passed = correctAnswers >= 4; // Need 4 out of 5 correct
      
      results[topic] = {
        correct: correctAnswers,
        total: totalQuestions,
        passed,
        questions: topicAnswers
      };
    });

    setEvaluationResults(results);

    // Generate AI report
    try {
      const aiReport = await generateEvaluationReport(results, prerequisitesArray);
      setReport(aiReport);
    } catch (error) {
      console.error('Error generating report:', error);
      setReport({
        remark: "Evaluation completed successfully. Please review your results above.",
        recommendations: []
      });
    }

    setLoading(false);
    setShowResults(true);
  };

  const handleShowReport = () => {
    setShowReport(true);
  };

  const handleProceedToLearning = () => {
    const topicsToLearn = prerequisitesArray.filter(topic => 
      !evaluationResults[topic]?.passed
    );
    onEvaluationComplete(topicsToLearn, evaluationResults);
  };

  if (prerequisitesArray.length === 0) {
    // No topics selected, skip evaluation
    onEvaluationComplete([], {});
    return null;
  }

  if (loading) {
    return (
      <div className="evaluation-container">
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
        
        <div className="loading">
          <MagicLoader size={120} particleCount={2} speed={1.2} hueRange={[200, 280]} />
          <p>Generating evaluation questions...</p>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="evaluation-container">
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

        {!showReport ? (
          <div className="results-section">
            <h2>Evaluation Results</h2>
            <div className="results-grid">
              {prerequisitesArray.map((topic, index) => {
                const result = evaluationResults[topic];
                return (
                  <div key={index} className={`result-card ${result.passed ? 'passed' : 'failed'}`}>
                    <h3>{topic}</h3>
                    <div className="score">
                      {result.correct}/{result.total}
                    </div>
                    <div className="status">
                      {result.passed ? '✓ Passed' : '✗ Failed'}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="results-actions">
              <button onClick={handleShowReport} className="action-button">
                View Report
              </button>
            </div>
          </div>
        ) : (
          <div className="report-section">
            <h2>Evaluation Report</h2>
            <div className="report-content">
              <div className="general-remark">
                <h3>General Remark</h3>
                <p>{report.remark}</p>
              </div>
              
              {report.recommendations && report.recommendations.length > 0 && (
                <div className="recommendations">
                  <h3>Recommendations</h3>
                  <ul>
                    {report.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="report-actions">
              <button onClick={handleProceedToLearning} className="action-button primary">
                Proceed to Learning
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="evaluation-container">
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

      <div className="quiz-section">
        <div className="quiz-header">
          <h2>Quiz • {currentTopic}</h2>
          <div className="progress">
            Question {currentQuestionIndex + 1} of {questions.length} • 
            Topic {currentTopicIndex + 1} of {prerequisitesArray.length}
          </div>
        </div>

        <div className="question-card">
          <h3>{currentQuestionIndex + 1}. {currentQuestion?.question}</h3>
          
          <div className="options">
            {currentQuestion?.options?.map((option, index) => (
              <div
                key={index}
                className={`option ${selectedAnswer === option ? 'selected' : ''}`}
                onClick={() => handleAnswerSelect(option)}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option}</span>
              </div>
            ))}
          </div>

          <div className="question-actions">
            <button
              onClick={handleNextQuestion}
              disabled={!selectedAnswer}
              className="next-button"
            >
              {currentQuestionIndex < questions.length - 1 
                ? 'Next Question' 
                : currentTopicIndex < prerequisitesArray.length - 1 
                  ? 'Next Topic' 
                  : 'Complete Evaluation'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Evaluation;
