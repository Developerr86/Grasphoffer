import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateFullName } from '../lib/userProfileService';
import { getRecentSessions } from '../lib/sessionService';
import { getMostStruggledTopics } from '../lib/topicStruggleService';
import { getComprehensiveAnalytics } from '../lib/analyticsService';
import { calculateAchievements, calculateUserLevel } from '../lib/achievementService';
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

const Profile = ({ onBack, onOpenTheHopper, onOpenPodcasts }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [struggledTopics, setStruggledTopics] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [achievements, setAchievements] = useState(null);
  const [userLevel, setUserLevel] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleDarkMode = (e) => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || prefersReducedMotion) {
      setIsDarkMode(!isDarkMode);
      document.documentElement.classList.toggle('dark');
      return;
    }
    const x = e.clientX ?? window.innerWidth / 2;
    const y = e.clientY ?? window.innerHeight / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    const transition = document.startViewTransition(() => {
      setIsDarkMode(prev => {
        const next = !prev;
        document.documentElement.classList.toggle('dark', next);
        return next;
      });
    });
    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`
          ]
        },
        {
          duration: 600,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  };

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
    <div className="bg-background-light dark:bg-background-dark text-black dark:text-white min-h-screen">
      {/* HEADER SECTION (Floating Nav) */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-fit max-w-[95%] z-50 flex items-center gap-4">
        <nav className="bg-white dark:bg-zinc-900 brutal-border rounded-[24px] brutal-shadow px-8 py-3 flex items-center gap-10">
          <div className="flex items-center cursor-pointer" onClick={onBack}>
            <span className="text-3xl font-[900] tracking-tighter uppercase">Grasphopper</span>
          </div>
          <div className="hidden lg:flex items-center gap-8">
            <button onClick={onBack} className="font-bold text-sm uppercase tracking-widest hover:underline decoration-4 underline-offset-4">Dashboard</button>
            <button className="font-bold text-sm uppercase tracking-widest hover:underline decoration-4 underline-offset-4 underline">Profile</button>
            <button onClick={onOpenTheHopper} className="font-bold text-sm uppercase tracking-widest hover:underline decoration-4 underline-offset-4">Ask TheHopper</button>
            <button onClick={onOpenPodcasts} className="font-bold text-sm uppercase tracking-widest hover:underline decoration-4 underline-offset-4">Podcasts</button>
          </div>
          <div className="flex items-center">
            <button onClick={toggleDarkMode} className="w-12 h-12 flex items-center justify-center bg-white dark:bg-zinc-800 brutal-border rounded-full brutal-shadow-sm hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform">
              {isDarkMode ? (
                <span className="material-symbols-outlined block text-white">light_mode</span>
              ) : (
                <span className="material-symbols-outlined block text-black">dark_mode</span>
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="pt-36 pb-20 px-6 max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-5xl md:text-6xl font-extrabold">My Profile</h1>
          <div className="w-16 h-16 bg-accent-yellow border-black border-[3px] rounded-full flex items-center justify-center brutal-shadow text-black font-extrabold text-2xl">
            {(profile?.full_name || user?.email || '').charAt(0).toUpperCase()}
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-black border-t-transparent border-dashed rounded-full animate-spin"></div>
            <p className="mt-6 font-bold text-xl uppercase tracking-widest">Loading...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Custom Tab Navigation */}
            <div className="flex flex-wrap gap-4 mb-4">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-8 py-3 rounded-full font-bold brutal-border brutal-shadow-sm transition-transform hover:-translate-y-1 ${activeTab === 'profile' ? 'bg-primary text-black' : 'bg-white dark:bg-zinc-800'}`}
              >
                Personal Info
              </button>
              <button
                onClick={() => setActiveTab('statistics')}
                className={`px-8 py-3 rounded-full font-bold brutal-border brutal-shadow-sm transition-transform hover:-translate-y-1 ${activeTab === 'statistics' ? 'bg-primary text-black' : 'bg-white dark:bg-zinc-800'}`}
              >
                Statistics
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`px-8 py-3 rounded-full font-bold brutal-border brutal-shadow-sm transition-transform hover:-translate-y-1 ${activeTab === 'progress' ? 'bg-primary text-black' : 'bg-white dark:bg-zinc-800'}`}
              >
                Progress & Achievements
              </button>
            </div>

            <div className="profile-content">
              {activeTab === 'profile' && (
                <div className="flex flex-col gap-8">
                  <div className="bg-white dark:bg-zinc-900 brutal-border brutal-shadow rounded-[2rem] p-8">
                    <h3 className="text-2xl font-extrabold mb-6 flex items-center gap-3">
                      <img src={userIcon} alt="Personal" className="w-8 h-8 dark:invert" /> Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                      <NeoInput label="Email" value={displayEmail} readOnly className="opacity-70 dark:bg-zinc-800" />
                      <NeoInput
                        label="Full Name"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="dark:bg-zinc-800 dark:text-white"
                      />
                      <div className="col-span-full flex items-center gap-4 mt-2">
                        <NeoButton onClick={handleSave} disabled={saving}>
                          {saving ? 'Saving...' : 'Save Changes'}
                        </NeoButton>
                        {saveMessage && (
                          <span className={`font-bold ${saveMessage.includes('failed') ? 'text-red-500' : 'text-green-500'}`}>
                            {saveMessage}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 brutal-border brutal-shadow rounded-[2rem] p-8">
                    <h3 className="text-2xl font-extrabold mb-6 flex items-center gap-3">
                      <img src={targetIcon} alt="Stats" className="w-8 h-8" /> Quick Stats
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-2xl brutal-border flex flex-col items-center">
                        <div className="text-sm font-bold uppercase opacity-60 mb-2 text-center">Total Sessions</div>
                        <div className="text-4xl font-extrabold">{totals.totalSessions}</div>
                      </div>
                      <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-2xl brutal-border flex flex-col items-center">
                        <div className="text-sm font-bold uppercase opacity-60 mb-2 text-center">Completed</div>
                        <div className="text-4xl font-extrabold">{totals.completedCount}</div>
                      </div>
                      <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-2xl brutal-border flex flex-col items-center">
                        <div className="text-sm font-bold uppercase opacity-60 mb-2 text-center">Avg Score</div>
                        <div className="text-4xl font-extrabold">{totals.avgScore}%</div>
                      </div>
                      <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-2xl brutal-border flex flex-col items-center text-center">
                        <div className="text-sm font-bold uppercase opacity-60 mb-2 text-center">Fast / Depth</div>
                        <div className="text-4xl font-extrabold">{(totals.byType.fast || 0)} / {(totals.byType.depth || 0)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 brutal-border brutal-shadow rounded-[2rem] p-8">
                    <h3 className="text-2xl font-extrabold mb-6 flex items-center gap-3">
                      <img src={treeIcon} alt="Sessions" className="w-8 h-8" /> Recent Sessions
                    </h3>
                    {sessions.length === 0 ? (
                      <p className="opacity-70 font-bold">No sessions yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                          <thead>
                            <tr className="border-b-4 border-black dark:border-white/20">
                              <th className="py-4 font-black text-lg">Topic</th>
                              <th className="py-4 font-black text-lg">Type</th>
                              <th className="py-4 font-black text-lg">Status</th>
                              <th className="py-4 font-black text-lg">Score</th>
                              <th className="py-4 font-black text-lg">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sessions.slice(0, 10).map(s => (
                              <tr key={s.id} className="border-b border-black/10 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                <td className="py-4 font-bold">{s.topic}</td>
                                <td className="py-4">
                                  <NeoBadge variant={s.session_type === 'fast' ? 'secondary' : 'primary'}>
                                    {s.session_type === 'fast' ? <span className="flex items-center gap-1"><img src={boltIcon} alt="Fast" className="w-5 h-5" /> Fast</span> : <span className="flex items-center gap-1"><img src={treeIcon} alt="Depth" className="w-5 h-5" /> Depth</span>}
                                  </NeoBadge>
                                </td>
                                <td className="py-4 capitalize font-bold opacity-80">{s.status}</td>
                                <td className="py-4 font-black text-xl">{s.final_score ? `${s.final_score}%` : '-'}</td>
                                <td className="py-4 font-bold opacity-60 text-sm">{new Date(s.created_at).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'statistics' && analytics && (
                <div className="flex flex-col gap-8">
                  <div className="bg-white dark:bg-zinc-900 brutal-border brutal-shadow rounded-[2rem] p-8">
                    <h3 className="text-2xl font-extrabold mb-6 flex items-center gap-3">
                      <img src={stopwatchIcon} alt="Time" className="w-8 h-8 filter dark:invert" /> Study Time Analytics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-[2rem] brutal-border flex flex-col justify-center items-center text-center">
                        <div className="text-sm font-bold uppercase opacity-60 mb-2">Total Time</div>
                        <div className="text-5xl font-black tracking-tighter">{Math.floor(analytics.time.totalStudyTime / 60)}h {analytics.time.totalStudyTime % 60}m</div>
                      </div>
                      <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-[2rem] brutal-border flex flex-col justify-center items-center text-center">
                        <div className="text-sm font-bold uppercase opacity-60 mb-2">Avg Session</div>
                        <div className="text-5xl font-black tracking-tighter">{analytics.time.averageSessionDuration}m</div>
                      </div>
                      <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-[2rem] brutal-border flex flex-col justify-center items-center text-center">
                        <div className="text-sm font-bold uppercase opacity-60 mb-2">This Week</div>
                        <div className="text-5xl font-black tracking-tighter">{Math.floor(analytics.time.studyTimeThisWeek / 60)}h {analytics.time.studyTimeThisWeek % 60}m</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-accent-yellow brutal-border brutal-shadow rounded-[2rem] p-8 text-black">
                    <h3 className="text-2xl font-extrabold mb-6 flex items-center gap-3">
                      <img src={boltIcon} alt="Streak" className="w-8 h-8" /> Study Streak
                    </h3>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-12">
                      <div className="text-center">
                        <div className="text-7xl font-black tracking-tighter mb-2">{analytics.streak.currentStreak}</div>
                        <div className="font-extrabold text-lg uppercase">Current Streak (Days)</div>
                      </div>
                      <div className="hidden md:block w-1 border-r-4 border-black h-24 opacity-20"></div>
                      <div className="text-center opacity-80">
                        <div className="text-5xl font-black tracking-tighter mb-2">{analytics.streak.longestStreak}</div>
                        <div className="font-extrabold uppercase text-sm">Longest Streak</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'progress' && analytics && achievements && userLevel && (
                <div className="flex flex-col gap-8">
                  <div className="bg-[#a855f7] brutal-border brutal-shadow rounded-[2rem] p-8 text-white relative overflow-hidden">
                    <h3 className="text-2xl font-extrabold mb-6 flex items-center gap-3 relative z-10">
                      <img src={targetIcon} alt="Level" className="w-8 h-8 filter brightness-0 invert" /> Learning Level
                    </h3>
                    <div className="flex items-center gap-6 relative z-10">
                      <div className="text-7xl bg-white/20 p-4 rounded-full brutal-border backdrop-blur-sm shadow-xl aspect-square flex items-center justify-center">
                        {userLevel.currentLevel.icon ? getIcon(userLevel.currentLevel.icon) : '⭐'}
                      </div>
                      <div>
                        <div className="text-4xl font-black mb-1 text-black">{userLevel.currentLevel.name}</div>
                        <div className="text-xl font-bold opacity-90 text-black">Level {userLevel.currentLevel.level} • {userLevel.totalPoints} points</div>
                        <div className="mt-2 font-bold opacity-80 bg-black/10 px-4 py-1 rounded-full inline-block text-black text-sm">
                          Next: {userLevel.nextLevel ? `${userLevel.nextLevel.name} (${userLevel.pointsToNext} pts needed)` : 'Max Level'}
                        </div>
                      </div>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute -right-10 -bottom-10 opacity-20 transform rotate-12 filter brightness-0 invert text-black">
                      <img src={targetIcon} alt="bg" className="w-64 h-64" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 brutal-border brutal-shadow rounded-[2rem] p-8">
                    <h3 className="text-2xl font-extrabold mb-6 flex items-center gap-3">
                      <img src={targetIcon} alt="Achievements" className="w-8 h-8" /> Achievements
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {achievements.earned.map(a => (
                        <div key={a.id} className="bg-primary brutal-border rounded-2xl p-6 flex items-start gap-4">
                          <div className="text-3xl bg-white/40 p-2 rounded-full border-2 border-black/10 flex-shrink-0">{getIcon(a.icon)}</div>
                          <div>
                            <div className="font-extrabold text-lg text-black leading-tight">{a.name}</div>
                            <div className="text-sm font-bold text-black/70 mt-1">{a.description}</div>
                          </div>
                        </div>
                      ))}
                      {achievements.available.slice(0, 3).map(a => (
                        <div key={a.id} className="bg-zinc-100 dark:bg-zinc-800 brutal-border rounded-2xl p-6 flex flex-col gap-3 opacity-80">
                          <div className="flex items-start gap-4">
                            <div className="text-3xl grayscale opacity-50 flex-shrink-0">{getIcon(a.icon)}</div>
                            <div>
                              <div className="font-extrabold text-lg line-through decoration-2 opacity-60 text-black dark:text-white mb-1 leading-tight">{a.name}</div>
                              <div className="text-sm font-bold opacity-50 dark:opacity-40">{a.description}</div>
                            </div>
                          </div>
                          <div className="w-full h-3 bg-black/10 dark:bg-white/10 rounded-full border border-black/20 overflow-hidden mt-1">
                            <div className="h-full bg-blue-500" style={{ width: `${a.progress}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
