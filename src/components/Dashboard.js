import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRecentSessions, getSessionResumeData } from '../lib/sessionService';
import { detectTopicFromContent } from '../lib/gemini';
import { getDisplayName } from '../lib/userProfileService';
import TopicInput from './TopicInput';
import FileUpload from './FileUpload';
import SessionTypeSelector from './SessionTypeSelector';
import NeoButton from './ui/NeoButton';
import NeoCard from './ui/NeoCard';
import NeoBadge from './ui/NeoBadge';
import './Dashboard.css';

// Icons
import hopperIcon from '../assets/icons/TheHopper_Icon.PNG';
import homeIcon from '../assets/icons/home.png';
import userIcon from '../assets/icons/User_icon.PNG';
import podcastIcon from '../assets/icons/podcast.png';
import logoutIcon from '../assets/icons/Log-Out.PNG';
import treeIcon from '../assets/icons/knowledge-tree-icon.PNG';
import boltIcon from '../assets/icons/Lightning-bolt.PNG';
import stopwatchIcon from '../assets/icons/Stop_watch-logo.PNG';
import checkIcon from '../assets/icons/green-tick.PNG';
import targetIcon from '../assets/icons/Target-board.PNG';

const Dashboard = ({ onStartLearning, onOpenProfile, onOpenTheHopper, onOpenPodcasts }) => {
  const { user, signOut } = useAuth();
  const [inputMethod, setInputMethod] = useState('topic');
  const [displayName, setDisplayName] = useState('');
  const [sessionType, setSessionType] = useState('fast');
  const [currentStep, setCurrentStep] = useState('dashboard');
  const [recentSessions, setRecentSessions] = useState([]);

  // ... (Keep existing logic functions: handleTopicSubmit, handleFilesSubmit, etc.)
  const handleTopicSubmit = (topic) => {
    console.log('Topic submitted:', topic);
    setCurrentStep('session-type');
    window.selectedTopic = topic;
  };

  const handleFilesSubmit = async (filesData) => {
    console.log('Files submitted:', filesData);
    if (filesData.hasProcessedContent && filesData.markdownContent) {
      try {
        console.log('Detecting topic from uploaded content...');
        const topicInfo = await detectTopicFromContent(filesData.markdownContent);
        console.log('Detected topic:', topicInfo);
        window.selectedFiles = {
          ...filesData,
          detectedTopic: topicInfo.topic,
          topicInfo: topicInfo
        };
        window.selectedTopic = topicInfo.topic;
      } catch (error) {
        console.error('Error detecting topic:', error);
        window.selectedFiles = filesData;
        window.selectedTopic = 'Uploaded Content';
      }
    } else {
      window.selectedFiles = filesData;
      window.selectedTopic = 'Uploaded Content';
    }
    setCurrentStep('session-type');
  };

  const handleSessionTypeChange = (type) => {
    setSessionType(type);
  };

  const handleStartLearning = () => {
    if (inputMethod === 'topic' && window.selectedTopic) {
      onStartLearning && onStartLearning({
        type: sessionType,
        topic: window.selectedTopic
      });
    } else if (inputMethod === 'files' && window.selectedFiles) {
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

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const name = await getDisplayName();
        setDisplayName(name);
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

  const handleContinueSession = async (sessionId) => {
    try {
      console.log('Continuing session:', sessionId);
      const result = await getSessionResumeData(sessionId);
      if (result.success) {
        const resumeData = result.resumeData;
        onStartLearning && onStartLearning({
          type: resumeData.sessionType,
          topic: resumeData.topic,
          resumeData: resumeData
        });
      } else {
        console.error('Failed to get resume data:', result.error);
        alert('Failed to continue session. Please try again.');
      }
    } catch (error) {
      console.error('Error continuing session:', error);
      alert('Failed to continue session. Please try again.');
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <img src={hopperIcon} alt="Grasphopper" className="logo-icon" style={{ width: '32px', height: '32px' }} />
            <span className="logo-text">Grasphopper</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NeoButton variant="ghost" className="neo-btn-full !justify-start" onClick={() => setCurrentStep('dashboard')}>
            <div className="nav-btn-content">
              <img src={homeIcon} alt="Dashboard" className="nav-icon" style={{ width: '24px', height: '24px' }} /> Dashboard
            </div>
          </NeoButton>
          <NeoButton variant="ghost" className="neo-btn-full !justify-start" onClick={onOpenProfile}>
            <div className="nav-btn-content">
              <img src={userIcon} alt="Profile" className="nav-icon" style={{ width: '24px', height: '24px' }} /> Profile
            </div>
          </NeoButton>
          <NeoButton variant="ghost" className="neo-btn-full !justify-start" onClick={onOpenTheHopper}>
            <div className="nav-btn-content">
              <img src={hopperIcon} alt="Ask TheHopper" className="nav-icon" style={{ width: '24px', height: '24px' }} /> Ask TheHopper
            </div>
          </NeoButton>
          <NeoButton variant="ghost" className="neo-btn-full !justify-start" onClick={onOpenPodcasts}>
            <div className="nav-btn-content">
              <img src={podcastIcon} alt="Podcasts" className="nav-icon" style={{ width: '24px', height: '24px' }} /> Podcasts
            </div>
          </NeoButton>
        </nav>

        <div className="sidebar-footer">
          <NeoButton variant="outline" className="neo-btn-full !justify-start sign-out-btn" onClick={signOut}>
            <div className="nav-btn-content">
              <img src={logoutIcon} alt="Sign Out" className="nav-icon" style={{ width: '24px', height: '24px' }} /> Sign Out
            </div>
          </NeoButton>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Top Header */}
        <header className="dashboard-header">
          <div>
            <h1 className="page-title">My Learning</h1>
            <p className="welcome-text">Welcome back, {displayName || 'Student'}!</p>
          </div>
          <div className="user-avatar-container" onClick={onOpenProfile}>
            <div className="user-avatar">
              <span className="avatar-initial">{(displayName || user?.email || '').charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="hero-section">
          <NeoCard padding="large">
            <div className="hero-card-content">
              <div className="hero-text-content">
                <div className="hero-badge">
                  <NeoBadge variant="secondary">Physics</NeoBadge>
                </div>
                <h2 className="hero-title">
                  The study of the<br />
                  structure of matter.
                </h2>
                <NeoButton size="large" onClick={() => setCurrentStep('input-method')}>
                  CONTINUE TO STUDY
                </NeoButton>
              </div>
              <div className="hero-visual">
                <div className="hero-icon-1"><img src={treeIcon} alt="Science" style={{ width: '80px', height: '80px' }} /></div>
                <div className="hero-icon-2"><img src={boltIcon} alt="Physics" style={{ width: '64px', height: '64px' }} /></div>
              </div>
            </div>
          </NeoCard>
        </section>

        {/* Content Grid */}
        <div className="dashboard-grid">
          {/* Left Column - Sessions */}
          <div className="sessions-column">
            <div className="section-header">
              <h3 className="section-title">Course you're taking</h3>
            </div>

            <div className="sessions-list">
              {recentSessions.length > 0 ? (
                recentSessions.slice(0, 4).map((session) => (
                  <NeoCard key={session.id} padding="medium" hoverEffect>
                    <div className="session-item-content">
                      <div className="session-icon-box">
                        <img src={session.session_type === 'fast' ? boltIcon : treeIcon} alt={session.session_type} style={{ width: '32px', height: '32px' }} />
                      </div>
                      <div className="session-info">
                        <h4 className="session-topic">{session.topic}</h4>
                        <div className="session-progress-container">
                          <div className="progress-track">
                            <div
                              className="progress-fill"
                              style={{ width: `${session.total_flashcards > 0 ? (session.studied_flashcards / session.total_flashcards) * 100 : 0}%` }}
                            ></div>
                          </div>
                          <span className="progress-text">
                            {session.total_flashcards > 0 ? Math.round((session.studied_flashcards / session.total_flashcards) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                      {(() => {
                        const progressPercent = session.total_flashcards > 0 ? Math.round((session.studied_flashcards / session.total_flashcards) * 100) : 0;
                        return progressPercent < 100 ? (
                          <NeoButton size="small" variant="secondary" onClick={() => handleContinueSession(session.id)}>
                            Continue
                          </NeoButton>
                        ) : (
                          <NeoBadge variant="primary">Completed</NeoBadge>
                        );
                      })()}
                    </div>
                  </NeoCard>
                ))
              ) : (
                <NeoCard className="empty-state">
                  <p className="empty-text">No learning sessions yet</p>
                  <NeoButton onClick={() => setCurrentStep('input-method')}>
                    Start your first session
                  </NeoButton>
                </NeoCard>
              )}
            </div>
          </div>

          {/* Right Column - Progress */}
          <div className="stats-column">
            <h3 className="section-title">My Progress</h3>

            <NeoCard className="bg-yellow">
              <div className="stat-card-header">
                <span className="stat-label">Study Time</span>
                <span className="stat-icon"><img src={stopwatchIcon} alt="Time" style={{ width: '64px', height: '64px' }} /></span>
              </div>
              <div className="stat-value">124 <span className="stat-unit">Hours</span></div>
              <div className="chart-bars">
                {[40, 70, 50, 90, 60, 80, 100].map((h, i) => (
                  <div key={i} className="chart-bar" style={{ height: `${h}%`, opacity: 0.2 + (i * 0.1) }}></div>
                ))}
              </div>
            </NeoCard>

            <NeoCard className="bg-purple">
              <div className="stat-card-header">
                <span className="stat-label">Sessions Completed</span>
                <span className="stat-icon"><img src={checkIcon} alt="Completed" style={{ width: '64px', height: '64px' }} /></span>
              </div>
              <div className="stat-value">
                {recentSessions.filter(s => {
                  const progressPercent = s.total_flashcards > 0 ? Math.round((s.studied_flashcards / s.total_flashcards) * 100) : 0;
                  return s.status === 'completed' || progressPercent === 100;
                }).length}
              </div>
            </NeoCard>

            <NeoCard>
              <div className="stat-card-header">
                <span className="stat-label">Avg. Score</span>
                <span className="stat-icon"><img src={targetIcon} alt="Score" style={{ width: '64px', height: '64px' }} /></span>
              </div>
              <div className="stat-value">
                {(() => {
                  const sessionsWithScores = recentSessions.filter(s => s.final_score !== null && s.final_score !== undefined);
                  if (sessionsWithScores.length === 0) return '0';
                  const average = sessionsWithScores.reduce((sum, s) => sum + s.final_score, 0) / sessionsWithScores.length;
                  return Math.round(average);
                })()}%
              </div>
            </NeoCard>
          </div>
        </div>

        {/* Modals */}
        {currentStep === 'input-method' && (
          <div className="modal-overlay">
            <div className="modal-container">
              <NeoCard padding="large">
                <div className="modal-header">
                  <h2 className="modal-title">Start Learning</h2>
                  <button onClick={() => setCurrentStep('dashboard')} className="close-modal-btn">×</button>
                </div>

                <div className="input-method-grid">
                  <button
                    className={`method-btn ${inputMethod === 'topic' ? 'selected-topic' : ''}`}
                    onClick={() => setInputMethod('topic')}
                  >
                    <span className="method-icon"><img src={targetIcon} alt="Topic" style={{ width: '40px', height: '40px' }} /></span>
                    <span className="method-label">Enter Topic</span>
                  </button>
                  <button
                    className={`method-btn ${inputMethod === 'files' ? 'selected-files' : ''}`}
                    onClick={() => setInputMethod('files')}
                  >
                    <span className="method-icon"><img src={treeIcon} alt="Files" style={{ width: '40px', height: '40px' }} /></span>
                    <span className="method-label">Upload Files</span>
                  </button>
                </div>

                <div>
                  {inputMethod === 'topic' && <TopicInput onTopicSubmit={handleTopicSubmit} />}
                  {inputMethod === 'files' && <FileUpload onFilesSubmit={handleFilesSubmit} />}
                </div>
              </NeoCard>
            </div>
          </div>
        )}

        {currentStep === 'session-type' && (
          <div className="modal-overlay">
            <div className="modal-container">
              <NeoCard padding="large">
                <div className="modal-header">
                  <h2 className="modal-title">Choose Style</h2>
                  <button onClick={() => setCurrentStep('dashboard')} className="close-modal-btn">×</button>
                </div>

                {window.selectedFiles?.detectedTopic && (
                  <div className="detected-topic-box">
                    <h3 className="detected-topic-title">Topic: {window.selectedFiles.detectedTopic}</h3>
                    {window.selectedFiles.topicInfo?.description && (
                      <p className="detected-topic-desc">{window.selectedFiles.topicInfo.description}</p>
                    )}
                  </div>
                )}

                <SessionTypeSelector
                  selectedType={sessionType}
                  onTypeChange={handleSessionTypeChange}
                />

                <div className="modal-footer">
                  <NeoButton size="large" onClick={handleStartLearning} disabled={!sessionType} fullWidth>
                    Start {sessionType === 'fast' ? 'Fast' : 'Depth'} Learning Session
                  </NeoButton>
                </div>
              </NeoCard>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
