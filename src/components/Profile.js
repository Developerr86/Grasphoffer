import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateFullName } from '../lib/userProfileService';
import { getRecentSessions } from '../lib/sessionService';
import { getMostStruggledTopics } from '../lib/topicStruggleService';
import { getComprehensiveAnalytics } from '../lib/analyticsService';
import { calculateAchievements, calculateUserLevel } from '../lib/achievementService';
import TrendChart from './charts/TrendChart';
import ProgressRing from './charts/ProgressRing';
import NeoButton from './ui/NeoButton';
import NeoCard from './ui/NeoCard';
import NeoBadge from './ui/NeoBadge';
import NeoInput from './ui/NeoInput';
import './Profile.css';

// Icons
import hopperIcon from '../assets/icons/TheHopper_Icon.PNG';
import homeIcon from '../assets/icons/home.png';
import userIcon from '../assets/icons/User_icon.PNG';
import targetIcon from '../assets/icons/Target-board.PNG';
import treeIcon from '../assets/icons/knowledge-tree-icon.PNG';
import boltIcon from '../assets/icons/Lightning-bolt.PNG';
import stopwatchIcon from '../assets/icons/Stop_watch-logo.PNG';
import checkIcon from '../assets/icons/green-tick.PNG';

const ICON_MAP = {
  'target': targetIcon,
  'fire': boltIcon,
  'bolt': boltIcon,
  'crown': targetIcon,
  'books': treeIcon,
  'grad_cap': treeIcon,
  'trophy': targetIcon,
  'hundred': targetIcon,
  'star': targetIcon,
  'chart': targetIcon,
  'clock': stopwatchIcon,
  'open_book': treeIcon,
  'runner': boltIcon,
  'dash': boltIcon,
  'wave': treeIcon,
  'scale': targetIcon,
  'loop': targetIcon,
  'seedling': treeIcon,
  'brain': treeIcon
};

const getIcon = (iconName) => {
  const IconSrc = ICON_MAP[iconName] || targetIcon;
  return <img src={IconSrc} alt={iconName} style={{ width: '32px', height: '32px' }} />;
};

const Profile = ({ onBack }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [struggledTopics, setStruggledTopics] = useState([]);
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
        const sessionsRes = await getRecentSessions(50);
        setSessions(sessionsRes.sessions || []);
        const { topics } = await getMostStruggledTopics(10);
        setStruggledTopics(topics || []);

        const analyticsRes = await getComprehensiveAnalytics(user.id);
        if (analyticsRes.success) {
          setAnalytics(analyticsRes.analytics);
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
            <img src={hopperIcon} alt="Grasphopper" className="profile-logo-icon" style={{ width: '32px', height: '32px' }} />
            <span className="profile-logo-text">Grasphopper</span>
          </div>
        </div>

        <nav className="profile-nav">
          <NeoButton
            variant={activeTab === 'profile' ? 'primary' : 'ghost'}
            className="neo-btn-full !justify-start"
            onClick={() => setActiveTab('profile')}
          >
            <div className="profile-nav-item">
              <img src={userIcon} alt="Profile" className="profile-nav-icon" style={{ width: '24px', height: '24px' }} /> Profile
            </div>
          </NeoButton>
          <NeoButton
            variant={activeTab === 'statistics' ? 'primary' : 'ghost'}
            className="neo-btn-full !justify-start"
            onClick={() => setActiveTab('statistics')}
          >
            <div className="profile-nav-item">
              <img src={targetIcon} alt="Statistics" className="profile-nav-icon" style={{ width: '24px', height: '24px' }} /> Statistics
            </div>
          </NeoButton>
          <NeoButton
            variant={activeTab === 'progress' ? 'primary' : 'ghost'}
            className="neo-btn-full !justify-start"
            onClick={() => setActiveTab('progress')}
          >
            <div className="profile-nav-item">
              <img src={targetIcon} alt="Progress" className="profile-nav-icon" style={{ width: '24px', height: '24px' }} /> Progress
            </div>
          </NeoButton>
        </nav>

        <div className="profile-sidebar-footer">
          <NeoButton variant="outline" className="neo-btn-full !justify-start" onClick={onBack}>
            <div className="profile-nav-item">
              <img src={homeIcon} alt="Back" className="profile-nav-icon" style={{ width: '24px', height: '24px' }} /> Back to Dashboard
            </div>
          </NeoButton>
        </div>
      </aside>

      {/* Main Content */}
      <main className="profile-main-content">
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
                <NeoCard padding="large">
                  <h3 className="profile-card-title">
                    <span><img src={userIcon} alt="Personal" style={{ width: '32px', height: '32px' }} /></span> Personal Information
                  </h3>
                  <div className="profile-form-grid">
                    <NeoInput label="Email" value={displayEmail} readOnly className="opacity-70" />
                    <NeoInput
                      label="Full Name"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                    <div className="profile-actions">
                      <NeoButton onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </NeoButton>
                      {saveMessage && (
                        <span className={`profile-save-message ${saveMessage.includes('failed') ? 'error' : 'success'}`}>
                          {saveMessage}
                        </span>
                      )}
                    </div>
                  </div>
                </NeoCard>

                <NeoCard padding="large">
                  <h3 className="profile-card-title">
                    <span><img src={targetIcon} alt="Stats" style={{ width: '32px', height: '32px' }} /></span> Quick Stats
                  </h3>
                  <div className="profile-stats-grid">
                    <div className="stat-box">
                      <div className="stat-box-label">Total Sessions</div>
                      <div className="stat-box-value">{totals.totalSessions}</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-box-label">Completed</div>
                      <div className="stat-box-value">{totals.completedCount}</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-box-label">Avg Score</div>
                      <div className="stat-box-value">{totals.avgScore}%</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-box-label">Fast / Depth</div>
                      <div className="stat-box-value">{(totals.byType.fast || 0)} / {(totals.byType.depth || 0)}</div>
                    </div>
                  </div>
                </NeoCard>

                <NeoCard padding="large">
                  <h3 className="profile-card-title">
                    <span><img src={treeIcon} alt="Sessions" style={{ width: '32px', height: '32px' }} /></span> Recent Sessions
                  </h3>
                  {sessions.length === 0 ? (
                    <p>No sessions yet.</p>
                  ) : (
                    <div className="sessions-table-container">
                      <table className="sessions-table">
                        <thead>
                          <tr>
                            <th>Topic</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Score</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions.slice(0, 10).map(s => (
                            <tr key={s.id}>
                              <td className="font-medium">{s.topic}</td>
                              <td>
                                <NeoBadge variant={s.session_type === 'fast' ? 'secondary' : 'primary'}>
                                  {s.session_type === 'fast' ? <span><img src={boltIcon} alt="Fast" style={{ width: '20px', height: '20px', verticalAlign: 'middle' }} /> Fast</span> : <span><img src={treeIcon} alt="Depth" style={{ width: '20px', height: '20px', verticalAlign: 'middle' }} /> Depth</span>}
                                </NeoBadge>
                              </td>
                              <td className="capitalize">{s.status}</td>
                              <td className="font-bold">{s.final_score ? `${s.final_score}%` : '-'}</td>
                              <td className="text-gray-600 text-sm">{new Date(s.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </NeoCard>
              </>
            )}

            {activeTab === 'statistics' && analytics && (
              <div className="profile-content">
                <NeoCard padding="large">
                  <h3 className="profile-card-title"><img src={stopwatchIcon} alt="Time" style={{ width: '32px', height: '32px' }} /> Study Time Analytics</h3>
                  <div className="profile-stats-grid">
                    <div className="stat-box">
                      <div className="stat-box-label">Total Time</div>
                      <div className="stat-box-value">{Math.floor(analytics.time.totalStudyTime / 60)}h {analytics.time.totalStudyTime % 60}m</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-box-label">Avg Session</div>
                      <div className="stat-box-value">{analytics.time.averageSessionDuration}m</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-box-label">This Week</div>
                      <div className="stat-box-value">{Math.floor(analytics.time.studyTimeThisWeek / 60)}h {analytics.time.studyTimeThisWeek % 60}m</div>
                    </div>
                  </div>
                </NeoCard>

                <NeoCard padding="large" className="bg-yellow">
                  <h3 className="profile-card-title"><img src={boltIcon} alt="Streak" style={{ width: '32px', height: '32px' }} /> Study Streak</h3>
                  <div className="streak-section">
                    <div className="streak-main">
                      <div className="streak-number">{analytics.streak.currentStreak}</div>
                      <div className="streak-label">Current Streak (Days)</div>
                    </div>
                    <div className="streak-secondary">
                      <div className="streak-number-sm">{analytics.streak.longestStreak}</div>
                      <div className="streak-label">Longest Streak</div>
                    </div>
                  </div>
                </NeoCard>
              </div>
            )}

            {activeTab === 'progress' && analytics && achievements && userLevel && (
              <div className="profile-content">
                <NeoCard padding="large" className="bg-purple">
                  <h3 className="profile-card-title"><img src={targetIcon} alt="Level" style={{ width: '32px', height: '32px' }} /> Learning Level</h3>
                  <div className="level-section">
                    <div className="level-icon">{getIcon(userLevel.currentLevel.icon)}</div>
                    <div className="level-info">
                      <div className="level-name">{userLevel.currentLevel.name}</div>
                      <div className="level-details">Level {userLevel.currentLevel.level} • {userLevel.totalPoints} points</div>
                      <div className="level-next">
                        Next: {userLevel.nextLevel ? `${userLevel.nextLevel.name} (${userLevel.pointsToNext} pts needed)` : 'Max Level'}
                      </div>
                    </div>
                  </div>
                </NeoCard>

                <NeoCard padding="large">
                  <h3 className="profile-card-title"><img src={targetIcon} alt="Achievements" style={{ width: '32px', height: '32px' }} /> Achievements</h3>
                  <div className="achievements-grid">
                    {achievements.earned.map(a => (
                      <div key={a.id} className="achievement-card earned">
                        <div className="achievement-icon">{getIcon(a.icon)}</div>
                        <div>
                          <div className="achievement-name">{a.name}</div>
                          <div className="achievement-desc">{a.description}</div>
                        </div>
                      </div>
                    ))}
                    {achievements.available.slice(0, 3).map(a => (
                      <div key={a.id} className="achievement-card available">
                        <div className="achievement-icon grayscale">{getIcon(a.icon)}</div>
                        <div>
                          <div className="achievement-name text-gray-600">{a.name}</div>
                          <div className="achievement-desc text-gray-500">{a.description}</div>
                          <div className="achievement-progress-bar">
                            <div className="achievement-progress-fill" style={{ width: `${a.progress}%` }}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </NeoCard>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
