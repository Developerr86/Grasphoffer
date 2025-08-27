import React, { useState, useEffect } from 'react';
import { getMostStruggledTopics, getOverallStruggleStats } from '../lib/topicStruggleService';
import './EvaluationReport.css';

/**
 * Evaluation Report Component
 * Shows detailed results after MCQ assessment with explanations for wrong answers
 */
const EvaluationReport = ({
  evaluationResults,
  questions,
  userAnswers,
  onContinue,
  onRetry,
  sessionId,
  onOpenTheHopper
}) => {
  const [struggledTopics, setStruggledTopics] = useState([]);
  const [overallStats, setOverallStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  // Load struggle data
  useEffect(() => {
    const loadStruggleData = async () => {
      try {
        setLoading(true);
        
        const [topicsResult, statsResult] = await Promise.all([
          getMostStruggledTopics(5),
          getOverallStruggleStats()
        ]);

        if (topicsResult.success) {
          setStruggledTopics(topicsResult.topics);
        }

        if (statsResult.success) {
          setOverallStats(statsResult.stats);
        }
      } catch (error) {
        console.error('Error loading struggle data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStruggleData();
  }, []);

  // Calculate results
  const totalQuestions = questions.length;
  const correctAnswers = evaluationResults.correct || 0;
  const wrongAnswers = totalQuestions - correctAnswers;
  const percentage = evaluationResults.percentage || 0;
  const passed = percentage >= 70;

  // Get wrong questions for detailed review
  const wrongQuestions = questions.filter((question, index) => {
    const userAnswer = userAnswers[index];
    return userAnswer !== question.correctAnswer;
  });

  const currentWrongQuestion = wrongQuestions[currentReviewIndex];

  return (
    <div className="evaluation-report">
      <div className="report-header">
        <div className="result-icon">
          {passed ? '🎉' : '📚'}
        </div>
        <h1>Evaluation Report</h1>
        <div className="overall-score">
          <span className={`score-percentage ${passed ? 'passed' : 'failed'}`}>
            {percentage}%
          </span>
          <span className="score-details">
            {correctAnswers}/{totalQuestions} correct
          </span>
        </div>
      </div>

      <div className="report-content">
        {/* Summary Section */}
        <div className="summary-section">
          <h2>📊 Performance Summary</h2>
          <div className="summary-grid">
            <div className="summary-card correct">
              <div className="summary-number">{correctAnswers}</div>
              <div className="summary-label">Correct Answers</div>
            </div>
            <div className="summary-card wrong">
              <div className="summary-number">{wrongAnswers}</div>
              <div className="summary-label">Wrong Answers</div>
            </div>
            <div className="summary-card accuracy">
              <div className="summary-number">{percentage}%</div>
              <div className="summary-label">Accuracy</div>
            </div>
            <div className={`summary-card result ${passed ? 'passed' : 'failed'}`}>
              <div className="summary-number">{passed ? '✅' : '❌'}</div>
              <div className="summary-label">{passed ? 'Passed' : 'Failed'}</div>
            </div>
          </div>
        </div>

        {/* Wrong Answers Review Section */}
        {wrongQuestions.length > 0 && (
          <div className="wrong-answers-section">
            <h2>🔍 Review Wrong Answers</h2>
            <div className="review-navigation">
              <span className="review-counter">
                Question {currentReviewIndex + 1} of {wrongQuestions.length} wrong answers
              </span>
              <div className="review-controls">
                <button 
                  onClick={() => setCurrentReviewIndex(Math.max(0, currentReviewIndex - 1))}
                  disabled={currentReviewIndex === 0}
                  className="nav-button prev"
                >
                  ← Previous
                </button>
                <button 
                  onClick={() => setCurrentReviewIndex(Math.min(wrongQuestions.length - 1, currentReviewIndex + 1))}
                  disabled={currentReviewIndex === wrongQuestions.length - 1}
                  className="nav-button next"
                >
                  Next →
                </button>
              </div>
            </div>

            {currentWrongQuestion && (
              <div className="question-review">
                <div className="question-text">
                  <h3>Question:</h3>
                  <p>{currentWrongQuestion.question}</p>
                </div>

                <div className="answers-comparison">
                  <div className="answer-section your-answer">
                    <h4>❌ Your Answer:</h4>
                    <div className="answer-option wrong">
                      {userAnswers[questions.indexOf(currentWrongQuestion)]}
                    </div>
                  </div>

                  <div className="answer-section correct-answer">
                    <h4>✅ Correct Answer:</h4>
                    <div className="answer-option correct">
                      {currentWrongQuestion.correctAnswer}
                    </div>
                  </div>
                </div>

                <div className="explanation-section">
                  <h4>💡 Explanation:</h4>
                  <div className="explanation-content">
                    {currentWrongQuestion.explanation || 
                     `The correct answer is "${currentWrongQuestion.correctAnswer}". This is a fundamental concept that requires understanding of the core principles.`}
                  </div>
                  
                  {currentWrongQuestion.whyWrongExplanation && (
                    <div className="why-wrong-explanation">
                      <h5>Why your answer was wrong:</h5>
                      <p>{currentWrongQuestion.whyWrongExplanation}</p>
                    </div>
                  )}
                </div>

                {currentWrongQuestion.topicCategory && (
                  <div className="topic-category">
                    <span className="topic-label">Topic:</span>
                    <span className="topic-name">{currentWrongQuestion.topicCategory}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Topic Struggles Section */}
        {!loading && struggledTopics.length > 0 && (
          <div className="struggles-section">
            <h2>📈 Your Learning Insights</h2>
            <div className="struggles-content">
              <h3>Topics you struggle with most:</h3>
              <div className="struggles-list">
                {struggledTopics.map((topic, index) => (
                  <div key={topic.id} className="struggle-item">
                    <div className="struggle-rank">#{index + 1}</div>
                    <div className="struggle-info">
                      <div className="struggle-topic">{topic.topic_name}</div>
                      <div className="struggle-stats">
                        {topic.struggle_count} mistakes out of {topic.total_attempts} attempts 
                        ({topic.struggle_percentage}% error rate)
                      </div>
                    </div>
                    <div className="struggle-bar">
                      <div 
                        className="struggle-fill" 
                        style={{ width: `${topic.struggle_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {overallStats && (
              <div className="overall-insights">
                <h3>Overall Performance:</h3>
                <div className="insights-grid">
                  <div className="insight-item">
                    <span className="insight-label">Topics Studied:</span>
                    <span className="insight-value">{overallStats.totalTopics}</span>
                  </div>
                  <div className="insight-item">
                    <span className="insight-label">Overall Accuracy:</span>
                    <span className="insight-value">{overallStats.overallAccuracy}%</span>
                  </div>
                  <div className="insight-item">
                    <span className="insight-label">Total Attempts:</span>
                    <span className="insight-value">{overallStats.totalAttempts}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="report-actions">
          {!passed && onRetry && (
            <button onClick={onRetry} className="action-button retry">
              🔄 Retry Assessment
            </button>
          )}
          <button onClick={onContinue} className="action-button continue">
            {passed ? '✅ Continue Learning' : '📚 Study More'}
          </button>
          {onOpenTheHopper && (
            <button onClick={onOpenTheHopper} className="action-button hopper">
              🦗 Hopper Explain
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvaluationReport;
