import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateFullName } from '../lib/userProfileService';
import { getRecentSessions } from '../lib/sessionService';
import { getMostStruggledTopics, getOverallStruggleStats } from '../lib/topicStruggleService';
import { getComprehensiveAnalytics } from '../lib/analyticsService';
import { calculateAchievements, calculateUserLevel } from '../lib/achievementService';
import TrendChart from './charts/TrendChart';
import ProgressRing from './charts/ProgressRing';
import './Profile.css';

const Profile = ({ onBack }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [struggledTopics, setStruggledTopics] = useState([]);
  // const [overallStats, setOverallStats] = useState(null); // Unused for now
  const [analytics, setAnalytics] = useState(null);
  const [achievements, setAchievements] = useState(null);
  const [userLevel, setUserLevel] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  const displayEmail = user?.email || '';

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const prof = await getUserProfile();
        setProfile(prof);
        setFullName(prof?.full_name || '');
        const sessionsRes = await getRecentSessions(50); // get a larger sample
        setSessions(sessionsRes.sessions || []);
        const { topics } = await getMostStruggledTopics(10);
        // const overall = await getOverallStruggleStats(); // Unused for now
        setStruggledTopics(topics || []);
        // setOverallStats(overall.success ? overall.stats : null); // Unused for now

        // Load comprehensive analytics
        const analyticsRes = await getComprehensiveAnalytics(user.id);
        if (analyticsRes.success) {
          setAnalytics(analyticsRes.analytics);

          // Calculate achievements and user level
          const userAchievements = calculateAchievements(analyticsRes.analytics);
          setAchievements(userAchievements);

          const level = calculateUserLevel(userAchievements, analyticsRes.analytics);
          setUserLevel(level);
        }
      } catch (e) {
        console.error('Profile load error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const totals = useMemo(() => {
    const totalSessions = sessions.length;
    const byType = sessions.reduce((acc, s) => {
      acc[s.session_type] = (acc[s.session_type] || 0) + 1;
      return acc;
    }, {});
    const completed = sessions.filter(s => s.status === 'completed');
    const avgScore = completed.length
      ? Math.round(completed.reduce((sum, s) => sum + (Number(s.final_score) || 0), 0) / completed.length)
      : 0;
    return { totalSessions, byType, avgScore, completedCount: completed.length };
  }, [sessions]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const updated = await updateFullName(fullName.trim());
      setProfile(updated);
      setSaveMessage('Saved!');
    } catch (e) {
      setSaveMessage(e.message || 'Save failed');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(''), 2000);
    }
  };

  return (
    <div className="profile-container">
      {/* Sidebar Navigation */}
      <aside className="profile-sidebar">
        <div className="profile-sidebar-header">
          <div className="profile-logo">
            <span className="profile-logo-icon">🧞‍♂️</span>
            <span className="profile-logo-text">Grasphopper</span>
          </div>
        </div>

        <nav className="profile-nav">
          <div
            className={`profile-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="profile-nav-icon">👤</span>
            <span className="profile-nav-text">Profile</span>
          </div>
          <div
            className={`profile-nav-item ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            <span className="profile-nav-icon">📊</span>
            <span className="profile-nav-text">Statistics</span>
          </div>
          <div
            className={`profile-nav-item ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            <span className="profile-nav-icon">🎯</span>
            <span className="profile-nav-text">Progress</span>
          </div>
        </nav>

        <div className="profile-sidebar-footer">
          <button onClick={onBack} className="profile-back-btn">
            <span className="profile-nav-icon">🏠</span>
            <span className="profile-nav-text">Back to Dashboard</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="profile-main-content">
        {/* Top Header */}
        <header className="profile-top-header">
          <h1 className="profile-page-title">My Profile</h1>
          <div className="profile-user-avatar">
            {(profile?.full_name || user?.email || '').charAt(0).toUpperCase()}
          </div>
        </header>

        {loading ? (
          <div className="profile-loading">
            <div className="profile-loading-spinner"></div>
            <p className="profile-loading-text">Loading profile...</p>
          </div>
        ) : (
          <div className="profile-content">
            {activeTab === 'profile' && (
              <>
                <div className="profile-card">
                  <h3>
                    <span className="profile-card-icon">👤</span>
                    Personal Information
                  </h3>
                  <div className="profile-form-group">
                    <label>Email</label>
                    <input type="text" value={displayEmail} readOnly />
                  </div>
                  <div className="profile-form-group">
                    <label>Full name</label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <button type="button" className="profile-save-button" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  {saveMessage && <span className="profile-save-message">{saveMessage}</span>}
                </div>

                <div className="profile-card">
                  <h3>
                    <span className="profile-card-icon">📊</span>
                    Quick Stats
                  </h3>
                  <div className="profile-metrics-grid">
                    <div className="profile-metric">
                      <div className="profile-metric-label">Total sessions</div>
                      <div className="profile-metric-value">{totals.totalSessions}</div>
                    </div>
                    <div className="profile-metric">
                      <div className="profile-metric-label">Completed</div>
                      <div className="profile-metric-value">{totals.completedCount}</div>
                    </div>
                    <div className="profile-metric">
                      <div className="profile-metric-label">Avg Score</div>
                      <div className="profile-metric-value">{totals.avgScore}%</div>
                    </div>
                    <div className="profile-metric">
                      <div className="profile-metric-label">Fast / Depth</div>
                      <div className="profile-metric-value">{(totals.byType.fast||0)} / {(totals.byType.depth||0)}</div>
                    </div>
                  </div>
                </div>

            <div className="profile-card">
              <h3>
                <span className="profile-card-icon">🎯</span>
                Weak Concept Areas
              </h3>
              {struggledTopics.length === 0 ? (
                <p>No struggled topics recorded yet.</p>
              ) : (
                <ul className="profile-topics-list">
                  {struggledTopics.map(t => (
                    <li key={t.id || t.topic_name} className="profile-topic-item">
                      <span className="profile-topic-name">{t.topic_name}</span>
                      <span className="profile-topic-metric">{t.struggle_count}/{t.total_attempts} struggled</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="profile-card">
              <h3>
                <span className="profile-card-icon">📚</span>
                Recent Sessions
              </h3>
              {sessions.length === 0 ? (
                <p>No sessions yet.</p>
              ) : (
                <div className="profile-sessions-table">
                  <div className="profile-sessions-header">
                    <div>Topic</div>
                    <div>Type</div>
                    <div>Status</div>
                    <div>Flashcards</div>
                    <div>Score</div>
                    <div>Date</div>
                  </div>
                  {sessions.slice(0, 10).map(s => (
                    <div key={s.id} className="profile-sessions-row">
                      <div>{s.topic}</div>
                      <div>{s.session_type === 'fast' ? '⚡ Fast' : '🌳 Depth'}</div>
                      <div>{s.status}</div>
                      <div>{s.studied_flashcards}/{s.total_flashcards}</div>
                      <div>{s.final_score ? `${s.final_score}%` : '-'}</div>
                      <div>{new Date(s.created_at).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
              </>
            )}

            {activeTab === 'statistics' && analytics && (
              <>
                {/* Time-based Metrics */}
                <div className="profile-card">
                  <h3>
                    <span className="profile-card-icon">⏰</span>
                    Study Time Analytics
                  </h3>
                  <div className="profile-metrics-grid">
                    <div className="profile-metric">
                      <div className="profile-metric-label">Total Study Time</div>
                      <div className="profile-metric-value">
                        {Math.floor(analytics.time.totalStudyTime / 60)}h {analytics.time.totalStudyTime % 60}m
                      </div>
                    </div>
                    <div className="profile-metric">
                      <div className="profile-metric-label">Avg Session</div>
                      <div className="profile-metric-value">{analytics.time.averageSessionDuration}m</div>
                    </div>
                    <div className="profile-metric">
                      <div className="profile-metric-label">This Week</div>
                      <div className="profile-metric-value">
                        {Math.floor(analytics.time.studyTimeThisWeek / 60)}h {analytics.time.studyTimeThisWeek % 60}m
                      </div>
                    </div>
                    <div className="profile-metric">
                      <div className="profile-metric-label">This Month</div>
                      <div className="profile-metric-value">
                        {Math.floor(analytics.time.studyTimeThisMonth / 60)}h {analytics.time.studyTimeThisMonth % 60}m
                      </div>
                    </div>
                  </div>
                </div>

                {/* Study Streak */}
                <div className="profile-card">
                  <h3>
                    <span className="profile-card-icon">🔥</span>
                    Study Streak
                  </h3>
                  <div className="streak-container">
                    <div className="streak-main">
                      <ProgressRing
                        percentage={Math.min((analytics.streak.currentStreak / 30) * 100, 100)}
                        color="#f59e0b"
                        size={120}
                        label="Current Streak"
                        sublabel={`${analytics.streak.currentStreak} days`}
                      />
                      <div className="streak-stats">
                        <div className="streak-stat">
                          <span className="streak-stat-label">Longest Streak</span>
                          <span className="streak-stat-value">{analytics.streak.longestStreak} days</span>
                        </div>
                        <div className="streak-stat">
                          <span className="streak-stat-label">Last Study</span>
                          <span className="streak-stat-value">
                            {analytics.streak.lastStudyDate ?
                              new Date(analytics.streak.lastStudyDate).toLocaleDateString() : 'Never'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Analytics */}
                <div className="profile-card">
                  <h3>
                    <span className="profile-card-icon">📈</span>
                    Performance Trends
                  </h3>
                  <div className="performance-analytics">
                    <div className="performance-summary">
                      <div className="performance-metric">
                        <span className="performance-label">Improvement Trend</span>
                        <span className={`performance-value ${analytics.performance.improvementTrend >= 0 ? 'positive' : 'negative'}`}>
                          {analytics.performance.improvementTrend >= 0 ? '+' : ''}{analytics.performance.improvementTrend}%
                        </span>
                      </div>
                      <div className="performance-metric">
                        <span className="performance-label">Completion Rate</span>
                        <span className="performance-value">{analytics.performance.completionRate}%</span>
                      </div>
                      <div className="performance-metric">
                        <span className="performance-label">Performance Growth</span>
                        <span className={`performance-value ${analytics.performance.performanceGrowth >= 0 ? 'positive' : 'negative'}`}>
                          {analytics.performance.performanceGrowth >= 0 ? '+' : ''}{analytics.performance.performanceGrowth}%
                        </span>
                      </div>
                    </div>
                    {analytics.performance.recentPerformance.length > 0 && (
                      <TrendChart
                        data={analytics.performance.recentPerformance}
                        title="Recent Performance Trend"
                        color="#10b981"
                      />
                    )}
                  </div>
                </div>

                {/* Learning Velocity */}
                <div className="profile-card">
                  <h3>
                    <span className="profile-card-icon">⚡</span>
                    Learning Velocity
                  </h3>
                  <div className="profile-metrics-grid">
                    <div className="profile-metric">
                      <div className="profile-metric-label">Flashcards/Session</div>
                      <div className="profile-metric-value">{analytics.velocity.flashcardsPerSession}</div>
                    </div>
                    <div className="profile-metric">
                      <div className="profile-metric-label">Questions/Minute</div>
                      <div className="profile-metric-value">{analytics.velocity.questionsPerMinute}</div>
                    </div>
                    <div className="profile-metric">
                      <div className="profile-metric-label">Learning Efficiency</div>
                      <div className="profile-metric-value">{analytics.velocity.learningEfficiency}</div>
                    </div>
                    <div className="profile-metric">
                      <div className="profile-metric-label">Fast vs Depth</div>
                      <div className="profile-metric-value">
                        {analytics.velocity.fastVsDepthEffectiveness.fast}% / {analytics.velocity.fastVsDepthEffectiveness.depth}%
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'progress' && analytics && achievements && userLevel && (
              <>
                {/* User Level */}
                <div className="profile-card">
                  <h3>
                    <span className="profile-card-icon">🏆</span>
                    Learning Level
                  </h3>
                  <div className="user-level">
                    <div className="level-main">
                      <div className="level-icon">{userLevel.currentLevel.icon}</div>
                      <div className="level-info">
                        <div className="level-name">{userLevel.currentLevel.name}</div>
                        <div className="level-number">Level {userLevel.currentLevel.level}</div>
                        <div className="level-points">{userLevel.totalPoints} points</div>
                      </div>
                      <div className="level-progress">
                        <ProgressRing
                          percentage={userLevel.progressToNext}
                          color="#667eea"
                          size={100}
                          label="Progress"
                          sublabel={userLevel.nextLevel ? `to ${userLevel.nextLevel.name}` : 'Max Level'}
                        />
                      </div>
                    </div>
                    {userLevel.nextLevel && (
                      <div className="level-next">
                        <span>Next: {userLevel.nextLevel.name} ({userLevel.pointsToNext} points needed)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Achievements */}
                <div className="profile-card">
                  <h3>
                    <span className="profile-card-icon">🏅</span>
                    Achievements ({achievements.totalEarned}/{achievements.totalAvailable})
                  </h3>

                  {/* Earned Achievements */}
                  {achievements.earned.length > 0 && (
                    <div className="achievements-section">
                      <h4 className="achievements-subtitle">🎉 Earned</h4>
                      <div className="achievements-grid">
                        {achievements.earned.slice(0, 6).map(achievement => (
                          <div key={achievement.id} className="achievement-item earned">
                            <div className="achievement-icon">{achievement.icon}</div>
                            <div className="achievement-info">
                              <div className="achievement-name">{achievement.name}</div>
                              <div className="achievement-description">{achievement.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Available Achievements */}
                  {achievements.available.length > 0 && (
                    <div className="achievements-section">
                      <h4 className="achievements-subtitle">🎯 In Progress</h4>
                      <div className="achievements-grid">
                        {achievements.available.slice(0, 4).map(achievement => (
                          <div key={achievement.id} className="achievement-item available">
                            <div className="achievement-icon">{achievement.icon}</div>
                            <div className="achievement-info">
                              <div className="achievement-name">{achievement.name}</div>
                              <div className="achievement-description">{achievement.description}</div>
                              <div className="achievement-progress">
                                <div className="achievement-progress-bar">
                                  <div
                                    className="achievement-progress-fill"
                                    style={{ width: `${achievement.progress}%` }}
                                  ></div>
                                </div>
                                <span className="achievement-progress-text">{Math.round(achievement.progress)}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Learning Journey Timeline */}
                <div className="profile-card">
                  <h3>
                    <span className="profile-card-icon">📅</span>
                    Learning Journey
                  </h3>
                  <div className="journey-timeline">
                    {sessions.slice(0, 5).map((session, index) => (
                      <div key={session.id} className="timeline-item">
                        <div className="timeline-marker">
                          <div className={`timeline-dot ${session.status}`}></div>
                          {index < 4 && <div className="timeline-line"></div>}
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="timeline-topic">{session.topic}</span>
                            <span className="timeline-date">
                              {new Date(session.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="timeline-details">
                            <span className="timeline-type">
                              {session.session_type === 'fast' ? '⚡ Fast' : '🌳 Depth'}
                            </span>
                            <span className="timeline-score">
                              {session.final_score ? `${session.final_score}%` : 'In Progress'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skill Development */}
                <div className="profile-card">
                  <h3>
                    <span className="profile-card-icon">🧠</span>
                    Skill Development
                  </h3>
                  <div className="skill-development">
                    <div className="skill-item">
                      <div className="skill-name">Learning Consistency</div>
                      <div className="skill-bar">
                        <div
                          className="skill-fill"
                          style={{ width: `${Math.min((analytics.streak.currentStreak / 7) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="skill-level">
                        {analytics.streak.currentStreak >= 30 ? 'Expert' :
                         analytics.streak.currentStreak >= 14 ? 'Advanced' :
                         analytics.streak.currentStreak >= 7 ? 'Intermediate' : 'Beginner'}
                      </div>
                    </div>

                    <div className="skill-item">
                      <div className="skill-name">Performance Excellence</div>
                      <div className="skill-bar">
                        <div
                          className="skill-fill"
                          style={{ width: `${Math.min(totals.avgScore, 100)}%` }}
                        ></div>
                      </div>
                      <div className="skill-level">
                        {totals.avgScore >= 90 ? 'Expert' :
                         totals.avgScore >= 80 ? 'Advanced' :
                         totals.avgScore >= 70 ? 'Intermediate' : 'Beginner'}
                      </div>
                    </div>

                    <div className="skill-item">
                      <div className="skill-name">Study Volume</div>
                      <div className="skill-bar">
                        <div
                          className="skill-fill"
                          style={{ width: `${Math.min((analytics.time.totalStudyTime / 3000) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="skill-level">
                        {analytics.time.totalStudyTime >= 3000 ? 'Expert' :
                         analytics.time.totalStudyTime >= 1800 ? 'Advanced' :
                         analytics.time.totalStudyTime >= 600 ? 'Intermediate' : 'Beginner'}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;

