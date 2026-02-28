import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRecentSessions, getSessionResumeData } from '../lib/sessionService';
import { detectTopicFromContent } from '../lib/gemini';
import { getDisplayName } from '../lib/userProfileService';
import TopicInput from './TopicInput';
import FileUpload from './FileUpload';
import SessionTypeSelector from './SessionTypeSelector';
import ExamDrillSetup from './ExamDrillSetup';
import NeoButton from './ui/NeoButton';
import NeoCard from './ui/NeoCard';
import NeoBadge from './ui/NeoBadge';

// Import newly downloaded assets for the brutalist layout
import lightningImg from '../assets/images/lightning.png';
import treeImg from '../assets/images/tree.png';
import microscopeImg from '../assets/images/microscope.png';
import stopwatchImg from '../assets/images/stopwatch.png';

const Dashboard = ({ onStartLearning, onOpenProfile, onOpenTheHopper, onOpenPodcasts }) => {
  const { user, signOut } = useAuth();
  const [inputMethod, setInputMethod] = useState('topic');
  const [displayName, setDisplayName] = useState('');
  const [sessionType, setSessionType] = useState('exam-drill');
  const [currentStep, setCurrentStep] = useState('dashboard');
  const [recentSessions, setRecentSessions] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleTopicSubmit = (topic) => {
    console.log('Topic submitted:', topic);
    setCurrentStep('session-type');
    window.selectedTopic = topic;
  };

  const handleFilesSubmit = async (filesData) => {
    if (filesData.hasProcessedContent && filesData.markdownContent) {
      try {
        const topicInfo = await detectTopicFromContent(filesData.markdownContent);
        window.selectedFiles = { ...filesData, detectedTopic: topicInfo.topic, topicInfo };
        window.selectedTopic = topicInfo.topic;
      } catch (error) {
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
    // Legacy support from original implementation
    if (inputMethod === 'topic' && window.selectedTopic) {
      onStartLearning && onStartLearning({ type: sessionType, topic: window.selectedTopic });
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
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };
    if (user) {
      loadDashboardData();
    }
    // Check initial dark mode from OS or class
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true);
    }
  }, [user]);

  const handleContinueSession = async (sessionId) => {
    try {
      const result = await getSessionResumeData(sessionId);
      if (result.success) {
        const resumeData = result.resumeData;
        onStartLearning && onStartLearning({
          type: resumeData.sessionType,
          topic: resumeData.topic,
          resumeData: resumeData
        });
      } else {
        alert('Failed to continue session. Please try again.');
      }
    } catch (error) {
      alert('Failed to continue session. Please try again.');
    }
  };

  const renderRecommendedCards = () => {
    const defaultRecommended = [
      { bg: "bg-blue-300", hoverBg: "group-hover:bg-blue-400", symbol: "H₂O", title: "Molecular Biology", sub: "12 Lessons • Beginner" },
      { bg: "bg-orange-300", hoverBg: "group-hover:bg-orange-400", symbol: "∫ dx", title: "Advanced Calculus", sub: "8 Lessons • Expert" },
      { bg: "bg-purple-300", hoverBg: "group-hover:bg-purple-400", symbol: "{}", title: "Quantum Coding", sub: "15 Lessons • Intermediate" },
      { bg: "bg-pink-300", hoverBg: "group-hover:bg-pink-400", symbol: "?!", title: "Logic & Rhetoric", sub: "10 Lessons • All levels" },
    ];

    return defaultRecommended.map((item, idx) => (
      <div key={idx} onClick={() => setCurrentStep('session-type')} className="p-6 bg-white dark:bg-zinc-900 brutal-border brutal-shadow rounded-3xl hover:-translate-y-2 transition-transform cursor-pointer group">
        <div className={`w-full h-40 ${item.bg} brutal-border rounded-2xl mb-4 flex items-center justify-center font-black text-5xl text-black ${item.hoverBg} transition-colors`}>{item.symbol}</div>
        <h5 className="font-extrabold text-xl mb-2">{item.title}</h5>
        <p className="text-sm font-medium opacity-60">{item.sub}</p>
      </div>
    ));
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-black dark:text-white min-h-screen">
      {/* HEADER SECTION */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-fit max-w-[95%] z-50 flex items-center gap-4">
        <nav className="bg-white dark:bg-zinc-900 brutal-border rounded-[24px] brutal-shadow px-8 py-3 flex items-center gap-10">
          <div className="flex items-center cursor-pointer" onClick={() => setCurrentStep('dashboard')}>
            <span className="text-3xl font-[900] tracking-tighter uppercase">Grasphopper</span>
          </div>
          <div className="hidden lg:flex items-center gap-8">
            <button onClick={() => setCurrentStep('dashboard')} className="font-bold text-sm uppercase tracking-widest hover:underline decoration-4 underline-offset-4">Dashboard</button>
            <button onClick={onOpenProfile} className="font-bold text-sm uppercase tracking-widest hover:underline decoration-4 underline-offset-4">Profile</button>
            <button onClick={onOpenTheHopper} className="font-bold text-sm uppercase tracking-widest hover:underline decoration-4 underline-offset-4">Ask TheHopper</button>
            <button onClick={onOpenPodcasts} className="font-bold text-sm uppercase tracking-widest hover:underline decoration-4 underline-offset-4">Podcasts</button>
          </div>
          <div className="flex items-center">
            <button onClick={toggleDarkMode} className="w-12 h-12 flex items-center justify-center bg-white dark:bg-zinc-800 brutal-border rounded-full brutal-shadow-sm hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform">
              {isDarkMode ? (
                <span className="material-symbols-outlined block">light_mode</span>
              ) : (
                <span className="material-symbols-outlined block">dark_mode</span>
              )}
            </button>
          </div>
        </nav>
        <button onClick={signOut} title="Sign Out" className="w-14 h-14 bg-accent brutal-border brutal-shadow rounded-full flex items-center justify-center hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-transform">
          <span className="material-symbols-outlined text-white font-black text-3xl">logout</span>
        </button>
      </header>

      {/* MODALS RENDERED AS OVERLAYS IF NEEDED */}
      {currentStep !== 'dashboard' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 brutal-border brutal-shadow rounded-[2rem] p-8 max-w-2xl w-full relative">
            <button onClick={() => setCurrentStep(currentStep === 'topic-input' || currentStep === 'exam-drill-setup' ? 'session-type' : 'dashboard')} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center brutal-border brutal-shadow-sm rounded-full bg-red-400 hover:bg-red-500 font-bold">✕</button>

            {currentStep === 'session-type' && (
              <div>
                <h2 className="text-3xl font-extrabold mb-6">Choose Your Learning Style</h2>
                <SessionTypeSelector
                  selectedType={sessionType}
                  onTypeChange={handleSessionTypeChange}
                />
                <div className="mt-8 flex justify-end">
                  <button onClick={() => {
                    if (sessionType === 'exam-drill') setCurrentStep('exam-drill-setup');
                    else setCurrentStep('topic-input');
                  }}
                    className="px-8 py-3 bg-primary brutal-border brutal-shadow rounded-full font-extrabold tracking-wide hover:bg-green-400 uppercase">
                    Continue
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'topic-input' && (
              <div>
                <h2 className="text-3xl font-extrabold mb-6">Enter Your Topic</h2>
                <TopicInput onTopicSubmit={(topic) => {
                  window.selectedTopic = topic;
                  onStartLearning && onStartLearning({
                    type: sessionType,
                    topic: topic
                  });
                }} />
              </div>
            )}

            {currentStep === 'exam-drill-setup' && (
              <div>
                <h2 className="text-3xl font-extrabold mb-6">Set Up Exam Drill</h2>
                <ExamDrillSetup
                  onStartDrill={(drillData) => {
                    onStartLearning && onStartLearning({
                      type: 'exam-drill',
                      topic: 'Exam Drill',
                      papers: drillData.selectedPapers
                    });
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="pt-36 pb-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12 flex flex-col items-center">
          <h2 className="text-5xl md:text-6xl font-extrabold mb-4">My Learning</h2>
          <p className="text-xl font-medium opacity-70">Welcome back, {displayName || 'Student'}!</p>
        </div>

        {/* HERO SECTION */}
        <section className="mb-16">
          <div className="bg-white dark:bg-zinc-900 brutal-border p-8 md:p-12 rounded-[2.5rem] brutal-shadow relative overflow-hidden text-center md:text-left">
            <div className="max-w-2xl relative z-10 mx-auto md:mx-0">
              <span className="inline-block px-4 py-1 bg-secondary brutal-border rounded-full font-bold text-sm mb-6 text-black">
                Physics
              </span>
              <h3 className="text-4xl md:text-6xl font-extrabold leading-tight mb-8">
                The study of the structure of matter.
              </h3>
              <div className="flex justify-center md:justify-start">
                <button onClick={() => setCurrentStep('session-type')} className="px-10 py-4 bg-primary brutal-border brutal-shadow rounded-full font-extrabold text-lg uppercase tracking-wider hover:bg-green-400 transition-colors text-black">
                  Continue to Study
                </button>
              </div>
            </div>

            {/* FLOATING ICONS GROUP FOR DESKTOP */}
            <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden lg:block opacity-90">
              <div className="relative w-48 h-48">
                <div className="w-40 h-40 bg-white dark:bg-zinc-800 border-4 border-black rounded-full flex items-center justify-center brutal-shadow mx-auto">
                  <img src={lightningImg} alt="lightning" className="w-16 h-16 absolute -top-4 -left-4" />
                  <img src={treeImg} alt="tree" className="w-24 h-24" />
                  <img src={microscopeImg} alt="microscope" className="w-16 h-16 absolute -bottom-4 -right-4" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RECENT COURSES AND PROGRESS DUAL-COLUMN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">

          {/* COURSE YOU'RE TAKING (LEFT) */}
          <div className="space-y-6">
            <h4 className="text-2xl font-extrabold px-2">Course you're taking</h4>

            {recentSessions.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 brutal-border rounded-[2rem] p-8 flex flex-col items-center justify-center text-center space-y-6 brutal-shadow min-h-[350px]">
                <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center brutal-border">
                  <span className="material-symbols-outlined text-4xl text-black dark:text-white">menu_book</span>
                </div>
                <p className="text-xl font-bold opacity-60">No learning sessions yet</p>
                <button onClick={() => setCurrentStep('session-type')} className="px-10 py-3 bg-secondary brutal-border brutal-shadow text-black rounded-full font-extrabold uppercase tracking-wide hover:bg-yellow-400">
                  See available courses
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {recentSessions.slice(0, 3).map((session) => {
                  const progressValue = session.total_flashcards > 0 ? Math.round((session.studied_flashcards / session.total_flashcards) * 100) : 0;
                  return (
                    <div key={session.id} className="bg-white dark:bg-zinc-900 brutal-border brutal-shadow rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6">
                      <div className="w-16 h-16 bg-blue-200 dark:bg-blue-400 rounded-full flex items-center justify-center brutal-border flex-shrink-0">
                        <span className="material-symbols-outlined text-black font-bold">bookmark</span>
                      </div>
                      <div className="flex-grow w-full md:w-auto text-center md:text-left">
                        <h5 className="font-extrabold text-xl mb-2 line-clamp-1">{session.topic}</h5>
                        <div className="flex items-center gap-4">
                          <div className="flex-grow h-4 bg-black/10 dark:bg-white/10 rounded-full border-2 border-black overflow-hidden relative">
                            <div className="h-full bg-primary border-r-2 border-black" style={{ width: `${progressValue}%` }}></div>
                          </div>
                          <span className="font-bold">{progressValue}%</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <button onClick={() => handleContinueSession(session.id)} className="px-6 py-2 bg-secondary text-black brutal-border brutal-shadow-sm rounded-full font-bold hover:bg-yellow-400 uppercase text-sm">
                          Continue
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* MY PROGRESS (RIGHT) */}
          <div className="space-y-6">
            <h4 className="text-2xl font-extrabold px-2">My Progress</h4>
            <div className="bg-white dark:bg-zinc-900 brutal-border rounded-[2rem] p-8 brutal-shadow h-full flex flex-col justify-between min-h-[350px]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">Study Time</p>
                  <h5 className="text-4xl font-extrabold tracking-tighter">12h 45m</h5>
                </div>
                <div className="w-20 h-20 bg-blue-400 brutal-border rounded-2xl flex items-center justify-center brutal-shadow">
                  <img src={stopwatchImg} alt="stopwatch" className="w-[80%] h-[80%]" />
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <div className="flex justify-between text-sm font-bold mb-3">
                    <span className="uppercase">Weekly Goal</span>
                    <span>85%</span>
                  </div>
                  <div className="w-full h-8 bg-black/5 dark:bg-white/10 border-4 border-black rounded-full overflow-hidden">
                    <div className="h-full bg-secondary border-r-4 border-black" style={{ width: '85%' }}></div>
                  </div>
                </div>

                <div className="p-4 bg-primary/20 dark:bg-primary/20 brutal-border rounded-2xl w-full">
                  <p className="text-sm font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-600 dark:text-primary">local_fire_department</span>
                    <span className="text-black dark:text-white">4 Day Streak! Keep going.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RECOMMENDED FOR YOU GRID */}
        <section className="mt-12 space-y-8">
          <h4 className="text-2xl font-extrabold text-center md:text-left px-2">Recommended for You</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {renderRecommendedCards()}
          </div>
        </section>

      </main>
    </div>
  );
};

export default Dashboard;
