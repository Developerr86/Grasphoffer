import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRecentSessions, getSessionResumeData } from '../lib/sessionService';
import { detectTopicFromContent } from '../lib/gemini';
import { getDisplayName } from '../lib/userProfileService';
import TopicInput from './TopicInput';
import FileUpload from './FileUpload';
import SessionTypeSelector from './SessionTypeSelector';
import './Dashboard.css';

const Dashboard = ({ onStartLearning, onOpenProfile, onOpenTheHopper, onOpenPodcasts }) => {
  const { user, signOut } = useAuth();
  const [inputMethod, setInputMethod] = useState('topic'); // 'topic' or 'files'
  const [displayName, setDisplayName] = useState(''); // full_name or email
  const [sessionType, setSessionType] = useState('fast'); // 'fast' or 'depth'
  const [currentStep, setCurrentStep] = useState('dashboard'); // 'dashboard', 'input-method', 'session-type', 'ready'
  const [recentSessions, setRecentSessions] = useState([]);

  // Handle topic submission
  const handleTopicSubmit = (topic) => {
    console.log('Topic submitted:', topic);
    setCurrentStep('session-type');
    // Store the topic for later use
    window.selectedTopic = topic;
  };

  // Handle files submission
  const handleFilesSubmit = async (filesData) => {
    console.log('Files submitted:', filesData);
    
    // If we have processed markdown content, detect the topic
    if (filesData.hasProcessedContent && filesData.markdownContent) {
      try {
        // Show loading state (you could add a loading state here)
        console.log('Detecting topic from uploaded content...');
        
        // Detect topic from the markdown content
        const topicInfo = await detectTopicFromContent(filesData.markdownContent);
        console.log('Detected topic:', topicInfo);
        
        // Store both the files data and detected topic
        window.selectedFiles = {
          ...filesData,
          detectedTopic: topicInfo.topic,
          topicInfo: topicInfo
        };
        
        // Store the detected topic for learning session
        window.selectedTopic = topicInfo.topic;
      } catch (error) {
        console.error('Error detecting topic:', error);
        // Fallback to generic topic
        window.selectedFiles = filesData;
        window.selectedTopic = 'Uploaded Content';
      }
    } else {
      // No processed content, use generic topic
      window.selectedFiles = filesData;
      window.selectedTopic = 'Uploaded Content';
    }
    
    setCurrentStep('session-type');
  };

  // Handle session type selection
  const handleSessionTypeChange = (type) => {
    setSessionType(type);
  };

  // Handle starting the learning session
  const handleStartLearning = () => {
    if (inputMethod === 'topic' && window.selectedTopic) {
      onStartLearning && onStartLearning({
        type: sessionType,
        topic: window.selectedTopic
      });
    } else if (inputMethod === 'files' && window.selectedFiles) {
      // Use the detected topic or fallback topic
      const topic = window.selectedFiles.detectedTopic || window.selectedTopic || 'Uploaded Content';
      
      onStartLearning && onStartLearning({
        type: sessionType,
        topic: topic,
        files: window.selectedFiles,
        markdownContent: window.selectedFiles.markdownContent,
        topicInfo: window.selectedFiles.topicInfo
      });
    }
  };

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load display name
        const name = await getDisplayName();
        setDisplayName(name);

        // Load recent sessions
        const result = await getRecentSessions(10);
        if (result.success) {
          setRecentSessions(result.sessions);
        } else {
          console.error('Failed to load recent sessions:', result.error);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Handle continuing a session
  const handleContinueSession = async (sessionId) => {
    try {
      console.log('Continuing session:', sessionId);
      const result = await getSessionResumeData(sessionId);

      if (result.success) {
        const resumeData = result.resumeData;
        console.log('Resume data:', resumeData);

        // Navigate to appropriate learning session with resume data
        onStartLearning && onStartLearning({
          type: resumeData.sessionType,
          topic: resumeData.topic,
          resumeData: resumeData
        });
      } else {
        console.error('Failed to get resume data:', result.error);
        // Could show a toast notification here
        alert('Failed to continue session. Please try again.');
      }
    } catch (error) {
      console.error('Error continuing session:', error);
      alert('Failed to continue session. Please try again.');
    }
  };



  return (
    <div className="modern-dashboard">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🧞‍♂️</span>
            <span className="logo-text">Grasphopper</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-item active">
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Dashboard</span>
          </div>
          <div className="nav-item" onClick={onOpenProfile}>
            <span className="nav-icon">👤</span>
            <span className="nav-text">Profile</span>
          </div>
          <div className="nav-item" onClick={onOpenTheHopper}>
            <span className="nav-icon">🦗</span>
            <span className="nav-text">Ask TheHopper</span>
          </div>
          <div className="nav-item" onClick={onOpenPodcasts}>
            <span className="nav-icon">🎙️</span>
            <span className="nav-text">Podcasts</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button onClick={signOut} className="signout-btn">
            <span className="nav-icon">🚪</span>
            <span className="nav-text">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <h1 className="page-title">My Learning</h1>
          </div>
          <div className="header-right">
            <div className="user-avatar" onClick={onOpenProfile}>
              <span>{(displayName || user?.email || '').charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-text">
              <div className="subject-tag">Physics</div>
              <h2 className="hero-title">
                The study of the<br />
                structure of matter.
              </h2>
              <button
                className="continue-course-btn"
                onClick={() => setCurrentStep('input-method')}
              >
                <span className="play-icon">▶</span>
                CONTINUE TO STUDY
              </button>
            </div>
            <div className="hero-visual">
              <div className="floating-elements">
                <div className="element element-1">🧪</div>
                <div className="element element-2">⚛️</div>
                <div className="element element-3">🔬</div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Grid */}
        <div className="content-grid">
          {/* Left Column */}
          <div className="left-column">
            {/* Learning Sessions Section */}
            <section className="sessions-section">
              <div className="section-header">
                <h3>Course you're taking</h3>
              </div>

              <div className="sessions-list">
                {recentSessions.length > 0 ? (
                  recentSessions.slice(0, 4).map((session) => (
                    <div key={session.id} className="session-item">
                      <div className="session-icon">
                        {session.session_type === 'fast' ? '⚡' : '🌳'}
                      </div>
                      <div className="session-details">
                        <h4>{session.topic}</h4>
                        <div className="session-progress">
                          <span className="hours-spent">
                            {session.studied_flashcards || 0} flashcards studied
                          </span>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${session.total_flashcards > 0 ?
                                  (session.studied_flashcards / session.total_flashcards) * 100 : 0}%`
                              }}
                            ></div>
                          </div>
                          <span className="progress-percent">
                            {session.total_flashcards > 0 ?
                              Math.round((session.studied_flashcards / session.total_flashcards) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                      {(() => {
                        // Calculate actual progress percentage
                        const progressPercent = session.total_flashcards > 0 ?
                          Math.round((session.studied_flashcards / session.total_flashcards) * 100) : 0;
                        const isCompleted = progressPercent === 100;

                        return (
                          <div className={`session-status-badge ${isCompleted ? 'completed' : 'in-progress'}`}>
                            {isCompleted ? 'Completed' : 'In progress'}
                          </div>
                        );
                      })()}

                      {/* Continue button for sessions that are not 100% complete */}
                      {(() => {
                        const progressPercent = session.total_flashcards > 0 ?
                          Math.round((session.studied_flashcards / session.total_flashcards) * 100) : 0;

                        // Show continue button only if progress is less than 100%
                        return progressPercent < 100 && (
                          <button
                            className="continue-session-btn"
                            onClick={() => handleContinueSession(session.id)}
                          >
                            <span className="continue-icon">▶️</span>
                            Continue
                          </button>
                        );
                      })()}
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>No learning sessions yet</p>
                    <button
                      onClick={() => setCurrentStep('input-method')}
                      className="start-first-session"
                    >
                      Start your first session
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="right-column">
            {/* Progress Section */}
            <section className="progress-section">
              <div className="section-header">
                <h3>My Progress</h3>
              </div>

              {/* Study Time Card */}
              <div className="progress-card">
                <div className="card-header">
                  <span>Track your study time</span>
                  <span className="info-icon">ℹ️</span>
                </div>
                <div className="study-time">
                  <div className="time-display">
                    <span className="time-number">124</span>
                    <span className="time-label">Hours</span>
                  </div>
                  <div className="time-chart">
                    {/* Simple bar chart representation */}
                    <div className="chart-bars">
                      <div className="bar" style={{height: '20%'}}></div>
                      <div className="bar" style={{height: '40%'}}></div>
                      <div className="bar" style={{height: '60%'}}></div>
                      <div className="bar" style={{height: '80%'}}></div>
                      <div className="bar" style={{height: '100%'}}></div>
                      <div className="bar" style={{height: '70%'}}></div>
                      <div className="bar" style={{height: '50%'}}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sessions Completed Card */}
              <div className="progress-card purple">
                <div className="card-header">
                  <span>Sessions completed</span>
                  <span className="info-icon">ℹ️</span>
                </div>
                <div className="completion-number">
                  {recentSessions.filter(s => {
                    // Check both status and progress completion
                    const progressPercent = s.total_flashcards > 0 ?
                      Math.round((s.studied_flashcards / s.total_flashcards) * 100) : 0;
                    return s.status === 'completed' || progressPercent === 100;
                  }).length}
                </div>
              </div>

              {/* Performance Card */}
              <div className="progress-card">
                <div className="card-header">
                  <span>Performance</span>
                  <span className="info-icon">ℹ️</span>
                </div>
                <div className="performance-content">
                  <div className="performance-score">
                    {(() => {
                      const sessionsWithScores = recentSessions.filter(s => s.final_score !== null && s.final_score !== undefined);
                      if (sessionsWithScores.length === 0) return '0';
                      const average = sessionsWithScores.reduce((sum, s) => sum + s.final_score, 0) / sessionsWithScores.length;
                      return Math.round(average);
                    })()}%
                  </div>
                  <div className="performance-chart">
                    {/* Performance trend line */}
                    <svg viewBox="0 0 100 40" className="trend-line">
                      <path d="M10,30 Q30,20 50,15 T90,10" stroke="#8b5cf6" strokeWidth="2" fill="none"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Complete Tests Card */}
              <div className="progress-card purple">
                <div className="card-header">
                  <span>Complete tests</span>
                  <span className="info-icon">ℹ️</span>
                </div>
                <div className="completion-number">
                  {recentSessions.filter(s => {
                    // Count sessions that have completed evaluations (have questions and final scores)
                    return s.total_questions > 0 && (s.status === 'completed' || s.final_score !== null);
                  }).length}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Input Method Modal */}
        {currentStep === 'input-method' && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>How would you like to start learning?</h2>
                <button
                  className="close-modal"
                  onClick={() => setCurrentStep('dashboard')}
                >
                  ×
                </button>
              </div>

              <div className="input-method-selection">
                <div className="method-selector">
                  <button
                    className={`method-option ${inputMethod === 'topic' ? 'selected' : ''}`}
                    onClick={() => setInputMethod('topic')}
                  >
                    <span className="method-icon">📝</span>
                    <span className="method-text">Enter Topic</span>
                  </button>
                  <button
                    className={`method-option ${inputMethod === 'files' ? 'selected' : ''}`}
                    onClick={() => setInputMethod('files')}
                  >
                    <span className="method-icon">📁</span>
                    <span className="method-text">Upload Files</span>
                  </button>
                </div>

                <div className="selected-method-content">
                  {inputMethod === 'topic' && (
                    <TopicInput onTopicSubmit={handleTopicSubmit} />
                  )}
                  {inputMethod === 'files' && (
                    <FileUpload onFilesSubmit={handleFilesSubmit} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Session Type Modal */}
        {currentStep === 'session-type' && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Choose Your Learning Style</h2>
                <button
                  className="close-modal"
                  onClick={() => setCurrentStep('dashboard')}
                >
                  ×
                </button>
              </div>

              {window.selectedFiles?.detectedTopic && (
                <div className="detected-topic-info">
                  <h3>Detected Topic: {window.selectedFiles.detectedTopic}</h3>
                  {window.selectedFiles.topicInfo?.description && (
                    <p>{window.selectedFiles.topicInfo.description}</p>
                  )}
                  {window.selectedFiles.topicInfo?.subtopics && window.selectedFiles.topicInfo.subtopics.length > 0 && (
                    <div className="subtopics">
                      <strong>Key areas:</strong> {window.selectedFiles.topicInfo.subtopics.join(', ')}
                    </div>
                  )}
                </div>
              )}

              <SessionTypeSelector
                selectedType={sessionType}
                onTypeChange={handleSessionTypeChange}
              />

              <div className="start-session-section">
                <button
                  className="start-session-button"
                  onClick={handleStartLearning}
                  disabled={!sessionType}
                >
                  Start {sessionType === 'fast' ? 'Fast' : 'Depth'} Learning Session
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
