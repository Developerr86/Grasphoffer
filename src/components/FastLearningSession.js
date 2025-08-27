import React, { useState, useEffect, useCallback } from 'react';
import { generateFlashcards } from '../lib/gemini';
import {
  createSession,
  updateSessionProgress,
  markFlashcardStudied,
  recordQuestionAnswer
} from '../lib/sessionService';
import { recordMultipleTopicStruggles } from '../lib/topicStruggleService';
import SessionDebugInfo from './SessionDebugInfo';
import EvaluationReport from './EvaluationReport';
import MagicLoader from './MagicLoader';
import './FastLearningSession.css';

const FastLearningSession = ({ topic: initialTopic = '', resumeData = null, onBack, onOpenTheHopper }) => {
  const [topic] = useState(initialTopic);
  const [currentPhase, setCurrentPhase] = useState(resumeData?.currentPhase || 'flashcards'); // 'flashcards', 'evaluation', 'report', 'completed'
  const [flashcards, setFlashcards] = useState(resumeData?.flashcards || []);
  const [currentCardIndex, setCurrentCardIndex] = useState(resumeData?.currentCardIndex || 0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studiedCards, setStudiedCards] = useState(resumeData?.studiedCards || new Set());
  const [loading, setLoading] = useState(false);

  // Session management
  const [sessionId, setSessionId] = useState(resumeData?.sessionId || null);
  const [sessionCreated, setSessionCreated] = useState(!!resumeData); // If resumeData exists, session is already created

  // Evaluation state
  const [questions, setQuestions] = useState(resumeData?.questions || []);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState(resumeData?.answeredQuestions ?
    resumeData.answeredQuestions.reduce((acc, q) => ({ ...acc, [q.questionIndex]: q.userAnswer }), {}) :
    {}
  );
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [evaluationResults, setEvaluationResults] = useState(null);

  // Generate 10 flashcards for fast learning
  const generateFastFlashcards = async (topicName) => {
    try {
      // Use the existing generateFlashcards function and limit to 10
      const cards = await generateFlashcards(topicName);
      return cards.slice(0, 10); // Ensure exactly 10 cards


    } catch (error) {
      console.error('Error generating fast flashcards:', error);
      // Fallback flashcards
      return Array.from({ length: 10 }, (_, index) => ({
        question: `Key Concept ${index + 1} of ${topicName}`,
        answer: `This is an important concept related to ${topicName} that you should understand.`
      }));
    }
  };

  // Generate 15 MCQ questions for evaluation
  const generateFastMCQQuestions = async (topicName) => {
    try {
      // Generate multiple batches to get 15 questions
      const batch1 = await import('../lib/gemini').then(module => module.generateMCQQuestions(topicName));
      const batch2 = await import('../lib/gemini').then(module => module.generateMCQQuestions(topicName));
      const batch3 = await import('../lib/gemini').then(module => module.generateMCQQuestions(topicName));

      const allQuestions = [...batch1, ...batch2, ...batch3];
      return allQuestions.slice(0, 15); // Take exactly 15 questions
    } catch (error) {
      console.error('Error generating fast MCQ questions:', error);
      // Fallback questions
      return Array.from({ length: 15 }, (_, index) => ({
        question: `Question ${index + 1} about ${topicName}?`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: ["Option A", "Option B", "Option C", "Option D"][index % 4]
      }));
    }
  };

  // Create session and load flashcards when component mounts
  const initializeSession = useCallback(async () => {
    if (!topic.trim() || sessionCreated) return;

    setLoading(true);
    try {
      // Generate flashcards and questions
      const cards = await generateFastFlashcards(topic);
      const evalQuestions = await generateFastMCQQuestions(topic);

      setFlashcards(cards);
      setQuestions(evalQuestions);

      // Create session in database
      const sessionResult = await createSession({
        sessionType: 'fast',
        topic: topic,
        flashcards: cards,
        mcqQuestions: evalQuestions
      });

      if (sessionResult.success) {
        setSessionId(sessionResult.session.id);
        setSessionCreated(true);
        console.log('Session created successfully:', sessionResult.session.id);
      } else {
        console.error('Failed to create session:', sessionResult.error);
      }
    } catch (error) {
      console.error('Error initializing session:', error);
    } finally {
      setLoading(false);
    }
  }, [topic, sessionCreated]);

  useEffect(() => {
    if (initialTopic && initialTopic.trim() && !resumeData) {
      initializeSession();
    } else if (resumeData) {
      // If resuming, we already have the data, just log it
      console.log('Resuming session with data:', resumeData);
      console.log('Current phase:', resumeData.currentPhase);
      console.log('Current card index:', resumeData.currentCardIndex);
      console.log('Studied cards:', resumeData.studiedCards);

      // If resuming in evaluation phase, set the correct question index
      if (resumeData.currentPhase === 'evaluation' && resumeData.answeredQuestions) {
        const answeredIndices = new Set(resumeData.answeredQuestions.map(q => q.questionIndex));
        let firstUnanswered = 0;
        for (let i = 0; i < resumeData.questions.length; i++) {
          if (!answeredIndices.has(i)) {
            firstUnanswered = i;
            break;
          }
        }
        setCurrentQuestionIndex(firstUnanswered);
        console.log('Resuming evaluation at question:', firstUnanswered);
      }
    }
  }, [initialTopic, initializeSession, resumeData]);

  // Flashcard navigation
  const handleCardClick = async () => {
    if (!isFlipped) {
      setIsFlipped(true);
      const newStudiedCards = new Set([...studiedCards, currentCardIndex]);
      setStudiedCards(newStudiedCards);

      // Mark flashcard as studied in database
      if (sessionId) {
        await markFlashcardStudied(sessionId, currentCardIndex);

        // Update session progress
        await updateSessionProgress(sessionId, {
          studiedFlashcards: newStudiedCards.size
        });
      }
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

  // Start evaluation phase
  const handleStartEvaluation = async () => {
    setCurrentPhase('evaluation');

    // If resuming, find the first unanswered question
    if (resumeData && resumeData.answeredQuestions) {
      const answeredIndices = new Set(resumeData.answeredQuestions.map(q => q.questionIndex));
      let firstUnanswered = 0;
      for (let i = 0; i < questions.length; i++) {
        if (!answeredIndices.has(i)) {
          firstUnanswered = i;
          break;
        }
      }
      setCurrentQuestionIndex(firstUnanswered);
    } else {
      setCurrentQuestionIndex(0);
      setAnswers({});
    }

    setSelectedAnswer('');
  };

  // Handle answer selection
  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  // Handle next question
  const handleNextQuestion = async () => {
    // Save answer
    const questionKey = currentQuestionIndex;
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    const answerData = {
      question: currentQuestion.question,
      selectedAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect
    };

    setAnswers(prev => ({
      ...prev,
      [questionKey]: answerData
    }));

    // Record answer in database
    if (sessionId) {
      await recordQuestionAnswer(sessionId, currentQuestionIndex, selectedAnswer, isCorrect);
    }

    // Move to next question or complete evaluation
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
    } else {
      completeEvaluation();
    }
  };

  // Complete evaluation
  const completeEvaluation = async () => {
    const finalAnswers = {
      ...answers,
      [currentQuestionIndex]: {
        question: questions[currentQuestionIndex].question,
        selectedAnswer,
        correctAnswer: questions[currentQuestionIndex].correctAnswer,
        isCorrect: selectedAnswer === questions[currentQuestionIndex].correctAnswer
      }
    };

    const correctCount = Object.values(finalAnswers).filter(answer => answer.isCorrect).length;
    const totalQuestions = questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    const results = {
      correct: correctCount,
      total: totalQuestions,
      percentage,
      passed: percentage >= 70 // 70% passing threshold
    };

    setEvaluationResults(results);

    // Record topic struggles for analytics
    try {
      const evaluationData = questions.map((question, index) => ({
        topicCategory: question.topicCategory || 'General',
        isCorrect: finalAnswers[index]?.isCorrect || false
      }));

      await recordMultipleTopicStruggles(evaluationData);
      console.log('Topic struggles recorded successfully');
    } catch (error) {
      console.error('Error recording topic struggles:', error);
    }

    // Update session as completed in database
    if (sessionId) {
      await updateSessionProgress(sessionId, {
        status: 'completed',
        correctAnswers: correctCount,
        finalScore: percentage,
        evaluationResults: results
      });
    }

    // Show evaluation report instead of going directly to completed
    setCurrentPhase('report');
  };

  // Handle continuing from evaluation report
  const handleReportContinue = () => {
    setCurrentPhase('completed');
  };

  // Handle retrying evaluation
  const handleReportRetry = () => {
    // Reset evaluation state
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setAnswers({});
    setEvaluationResults(null);
    setCurrentPhase('evaluation');
  };

  const allCardsStudied = studiedCards.size === flashcards.length;
  const progress = flashcards.length > 0 ? (studiedCards.size / flashcards.length) * 100 : 0;

  // Render loading state
  if (loading) {
    return (
      <div className="fast-learning-container">
        <div className="loading-section">
          <MagicLoader size={120} particleCount={2} speed={1.2} hueRange={[200, 280]} />
          <p>Preparing your fast learning session...</p>
        </div>
      </div>
    );
  }

  // Render evaluation report phase
  if (currentPhase === 'report') {
    // Convert answers object to array format for the report
    const userAnswersArray = questions.map((_, index) => answers[index]?.selectedAnswer || '');

    return (
      <EvaluationReport
        evaluationResults={evaluationResults}
        questions={questions}
        userAnswers={userAnswersArray}
        onContinue={handleReportContinue}
        onRetry={handleReportRetry}
        sessionId={sessionId}
        onOpenTheHopper={onOpenTheHopper}
      />
    );
  }

  // Render evaluation phase
  if (currentPhase === 'evaluation') {
    const currentQuestion = questions[currentQuestionIndex];
    const questionProgress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className="fast-learning-container">
        <div className="nav-menu" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </div>

        <h1 className="title">Fast Learning Evaluation</h1>
        <div className="topic-display">Topic: {topic}</div>

        <div className="evaluation-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${questionProgress}%` }}></div>
          </div>
          <span className="progress-text">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>

        {currentQuestion && (
          <div className="question-section">
            <div className="question-card">
              <h3>{currentQuestion.question}</h3>
              <div className="options-grid">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    className={`option-button ${selectedAnswer === option ? 'selected' : ''}`}
                    onClick={() => handleAnswerSelect(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="next-question-button"
              onClick={handleNextQuestion}
              disabled={!selectedAnswer}
            >
              {currentQuestionIndex === questions.length - 1 ? 'Complete Evaluation' : 'Next Question'}
            </button>
          </div>
        )}

        {/* Hopper Explain Button */}
        {onOpenTheHopper && (
          <button
            onClick={onOpenTheHopper}
            className="hopper-explain-button"
            title="Ask TheHopper to explain concepts"
          >
            <span className="hopper-icon">🦗</span>
            Hopper Explain
          </button>
        )}
      </div>
    );
  }

  // Render completion phase
  if (currentPhase === 'completed') {
    return (
      <div className="fast-learning-container">
        <div className="nav-menu" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </div>

        <h1 className="title">Fast Learning Complete!</h1>
        
        <div className="completion-section">
          <div className="completion-icon">
            {evaluationResults?.passed ? '🎉' : '📚'}
          </div>
          
          <div className="results-summary">
            <h2>Your Results</h2>
            <div className="score-display">
              <span className="score-number">{evaluationResults?.percentage}%</span>
              <span className="score-details">
                {evaluationResults?.correct} out of {evaluationResults?.total} correct
              </span>
            </div>
            
            <div className={`result-status ${evaluationResults?.passed ? 'passed' : 'needs-improvement'}`}>
              {evaluationResults?.passed ? 
                'Great job! You have a good understanding of the topic.' :
                'Keep studying! Review the material and try again.'
              }
            </div>
          </div>

          <button className="restart-button" onClick={() => setCurrentPhase('flashcards')}>
            Study Again
          </button>
        </div>
      </div>
    );
  }

  // Render flashcards phase (default)
  return (
    <div className="fast-learning-container">
      {/* Debug info - only shows in development */}
      <SessionDebugInfo
        sessionId={sessionId}
        currentPhase={currentPhase}
        currentCardIndex={currentCardIndex}
        studiedCards={studiedCards}
        currentQuestionIndex={currentQuestionIndex}
        answers={answers}
        resumeData={resumeData}
      />

      <div className="nav-menu" onClick={onBack}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </div>

      <h1 className="title">Fast Learning</h1>
      <div className="topic-display">Topic: {topic}</div>

      {flashcards.length > 0 && (
        <>
          <div className="progress-section">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="progress-text">
              {studiedCards.size} of {flashcards.length} cards studied
            </span>
          </div>

          <div className="flashcard-section">
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

            <div className="card-navigation">
              <button
                onClick={handlePrevCard}
                disabled={currentCardIndex === 0}
                className="nav-button"
              >
                ← Previous
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
                onClick={handleNextCard}
                disabled={currentCardIndex === flashcards.length - 1}
                className="nav-button"
              >
                Next →
              </button>
            </div>

            {allCardsStudied && (
              <div className="completion-actions">
                <button
                  onClick={handleStartEvaluation}
                  className="start-evaluation-button"
                >
                  Start Evaluation (15 Questions)
                </button>
              </div>
            )}
          </div>

          {/* Hopper Explain Button */}
          {onOpenTheHopper && (
            <button
              onClick={onOpenTheHopper}
              className="hopper-explain-button"
              title="Ask TheHopper to explain concepts"
            >
              <span className="hopper-icon">🦗</span>
              Hopper Explain
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default FastLearningSession;
