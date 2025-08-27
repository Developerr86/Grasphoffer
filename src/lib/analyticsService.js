import { supabase } from './supabase';

/**
 * Enhanced Analytics Service
 * Provides comprehensive learning analytics and insights
 */

/**
 * Calculate study streak for a user
 * @param {Array} sessions - Array of learning sessions
 * @returns {Object} Streak information
 */
export const calculateStudyStreak = (sessions) => {
  if (!sessions || sessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastStudyDate: null };
  }

  // Sort sessions by date (most recent first)
  const sortedSessions = sessions
    .filter(s => s.created_at)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (sortedSessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastStudyDate: null };
  }

  // Get unique study dates
  const studyDates = [...new Set(
    sortedSessions.map(s => new Date(s.created_at).toDateString())
  )].sort((a, b) => new Date(b) - new Date(a));

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

  // Calculate current streak
  for (let i = 0; i < studyDates.length; i++) {
    const currentDate = studyDates[i];
    const expectedDate = i === 0 ? 
      (currentDate === today || currentDate === yesterday ? currentDate : null) :
      new Date(new Date(studyDates[i-1]) - 24 * 60 * 60 * 1000).toDateString();

    if (i === 0 && (currentDate === today || currentDate === yesterday)) {
      currentStreak = 1;
      tempStreak = 1;
    } else if (currentDate === expectedDate) {
      currentStreak++;
      tempStreak++;
    } else {
      break;
    }
  }

  // Calculate longest streak
  tempStreak = 0;
  for (let i = 0; i < studyDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const currentDate = new Date(studyDates[i]);
      const previousDate = new Date(studyDates[i-1]);
      const dayDiff = (previousDate - currentDate) / (24 * 60 * 60 * 1000);

      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    currentStreak,
    longestStreak,
    lastStudyDate: sortedSessions[0].created_at
  };
};

/**
 * Calculate total study time and session duration analytics
 * @param {Array} sessions - Array of learning sessions
 * @returns {Object} Time analytics
 */
export const calculateTimeAnalytics = (sessions) => {
  if (!sessions || sessions.length === 0) {
    return {
      totalStudyTime: 0,
      averageSessionDuration: 0,
      totalSessions: 0,
      studyTimeThisWeek: 0,
      studyTimeThisMonth: 0
    };
  }

  const now = new Date();
  const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  let totalStudyTime = 0;
  let studyTimeThisWeek = 0;
  let studyTimeThisMonth = 0;
  let sessionsWithDuration = 0;

  sessions.forEach(session => {
    const createdAt = new Date(session.created_at);
    const completedAt = session.completed_at ? new Date(session.completed_at) : null;
    
    // Estimate session duration (if not available, use defaults based on session type)
    let duration = 0;
    if (completedAt && createdAt) {
      duration = (completedAt - createdAt) / (1000 * 60); // minutes
    } else {
      // Estimate based on session type and content
      const flashcardTime = (session.total_flashcards || 0) * 1.5; // 1.5 min per flashcard
      const questionTime = (session.total_questions || 0) * 2; // 2 min per question
      duration = Math.max(flashcardTime + questionTime, session.session_type === 'depth' ? 20 : 10);
    }

    totalStudyTime += duration;
    if (duration > 0) sessionsWithDuration++;

    // Weekly and monthly calculations
    if (createdAt >= oneWeekAgo) {
      studyTimeThisWeek += duration;
    }
    if (createdAt >= oneMonthAgo) {
      studyTimeThisMonth += duration;
    }
  });

  return {
    totalStudyTime: Math.round(totalStudyTime),
    averageSessionDuration: sessionsWithDuration > 0 ? Math.round(totalStudyTime / sessionsWithDuration) : 0,
    totalSessions: sessions.length,
    studyTimeThisWeek: Math.round(studyTimeThisWeek),
    studyTimeThisMonth: Math.round(studyTimeThisMonth)
  };
};

/**
 * Calculate performance trends and analytics
 * @param {Array} sessions - Array of learning sessions
 * @returns {Object} Performance analytics
 */
export const calculatePerformanceAnalytics = (sessions) => {
  if (!sessions || sessions.length === 0) {
    return {
      improvementTrend: 0,
      bestPerformingTopic: null,
      completionRate: 0,
      accuracyByDifficulty: {},
      recentPerformance: [],
      performanceGrowth: 0
    };
  }

  const completedSessions = sessions.filter(s => s.status === 'completed' && s.final_score !== null);
  const completionRate = sessions.length > 0 ? (completedSessions.length / sessions.length) * 100 : 0;

  // Calculate improvement trend (last 5 vs previous 5 sessions)
  const recentSessions = completedSessions.slice(0, 5);
  const previousSessions = completedSessions.slice(5, 10);
  
  const recentAvg = recentSessions.length > 0 ? 
    recentSessions.reduce((sum, s) => sum + s.final_score, 0) / recentSessions.length : 0;
  const previousAvg = previousSessions.length > 0 ? 
    previousSessions.reduce((sum, s) => sum + s.final_score, 0) / previousSessions.length : 0;
  
  const improvementTrend = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

  // Find best performing topic
  const topicPerformance = {};
  completedSessions.forEach(session => {
    if (!topicPerformance[session.topic]) {
      topicPerformance[session.topic] = { scores: [], count: 0 };
    }
    topicPerformance[session.topic].scores.push(session.final_score);
    topicPerformance[session.topic].count++;
  });

  let bestPerformingTopic = null;
  let bestAverage = 0;
  Object.entries(topicPerformance).forEach(([topic, data]) => {
    const average = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length;
    if (average > bestAverage && data.count >= 2) { // At least 2 sessions for reliability
      bestAverage = average;
      bestPerformingTopic = { topic, average: Math.round(average), sessions: data.count };
    }
  });

  // Recent performance for trend visualization
  const recentPerformance = completedSessions
    .slice(0, 10)
    .reverse()
    .map(session => ({
      date: session.created_at,
      score: session.final_score,
      topic: session.topic
    }));

  // Performance growth (first vs last session)
  const performanceGrowth = completedSessions.length >= 2 ? 
    completedSessions[0].final_score - completedSessions[completedSessions.length - 1].final_score : 0;

  return {
    improvementTrend: Math.round(improvementTrend * 10) / 10,
    bestPerformingTopic,
    completionRate: Math.round(completionRate),
    recentPerformance,
    performanceGrowth: Math.round(performanceGrowth)
  };
};

/**
 * Calculate learning velocity metrics
 * @param {Array} sessions - Array of learning sessions
 * @returns {Object} Learning velocity analytics
 */
export const calculateLearningVelocity = (sessions) => {
  if (!sessions || sessions.length === 0) {
    return {
      flashcardsPerSession: 0,
      questionsPerMinute: 0,
      learningEfficiency: 0,
      fastVsDepthEffectiveness: { fast: 0, depth: 0 }
    };
  }

  const completedSessions = sessions.filter(s => s.status === 'completed');
  
  // Flashcards per session
  const totalFlashcards = sessions.reduce((sum, s) => sum + (s.studied_flashcards || 0), 0);
  const flashcardsPerSession = sessions.length > 0 ? totalFlashcards / sessions.length : 0;

  // Questions per minute (estimated)
  const totalQuestions = sessions.reduce((sum, s) => sum + (s.total_questions || 0), 0);
  const timeAnalytics = calculateTimeAnalytics(sessions);
  const questionsPerMinute = timeAnalytics.totalStudyTime > 0 ? totalQuestions / timeAnalytics.totalStudyTime : 0;

  // Learning efficiency (score per minute)
  const totalScore = completedSessions.reduce((sum, s) => sum + (s.final_score || 0), 0);
  const learningEfficiency = timeAnalytics.totalStudyTime > 0 ? totalScore / timeAnalytics.totalStudyTime : 0;

  // Fast vs Depth effectiveness
  const fastSessions = completedSessions.filter(s => s.session_type === 'fast');
  const depthSessions = completedSessions.filter(s => s.session_type === 'depth');
  
  const fastAvg = fastSessions.length > 0 ? 
    fastSessions.reduce((sum, s) => sum + s.final_score, 0) / fastSessions.length : 0;
  const depthAvg = depthSessions.length > 0 ? 
    depthSessions.reduce((sum, s) => sum + s.final_score, 0) / depthSessions.length : 0;

  return {
    flashcardsPerSession: Math.round(flashcardsPerSession * 10) / 10,
    questionsPerMinute: Math.round(questionsPerMinute * 100) / 100,
    learningEfficiency: Math.round(learningEfficiency * 100) / 100,
    fastVsDepthEffectiveness: {
      fast: Math.round(fastAvg),
      depth: Math.round(depthAvg)
    }
  };
};

/**
 * Calculate content engagement metrics
 * @param {Array} sessions - Array of learning sessions
 * @returns {Object} Content engagement analytics
 */
export const calculateContentEngagement = (sessions) => {
  if (!sessions || sessions.length === 0) {
    return {
      topicFrequency: [],
      preferredLearningMethod: null,
      documentsProcessed: 0,
      mostStudiedTopic: null
    };
  }

  // Topic frequency analysis
  const topicCounts = {};
  sessions.forEach(session => {
    topicCounts[session.topic] = (topicCounts[session.topic] || 0) + 1;
  });

  const topicFrequency = Object.entries(topicCounts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Preferred learning method
  const fastCount = sessions.filter(s => s.session_type === 'fast').length;
  const depthCount = sessions.filter(s => s.session_type === 'depth').length;
  const preferredLearningMethod = fastCount > depthCount ? 'fast' : 
    depthCount > fastCount ? 'depth' : 'balanced';

  // Most studied topic
  const mostStudiedTopic = topicFrequency.length > 0 ? topicFrequency[0] : null;

  return {
    topicFrequency,
    preferredLearningMethod,
    documentsProcessed: 0, // This would need to be fetched from document storage
    mostStudiedTopic
  };
};

/**
 * Get comprehensive analytics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Complete analytics data
 */
export const getComprehensiveAnalytics = async (userId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get all user sessions
    const { data: sessions, error } = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate all analytics
    const streakData = calculateStudyStreak(sessions);
    const timeAnalytics = calculateTimeAnalytics(sessions);
    const performanceAnalytics = calculatePerformanceAnalytics(sessions);
    const learningVelocity = calculateLearningVelocity(sessions);
    const contentEngagement = calculateContentEngagement(sessions);

    return {
      success: true,
      analytics: {
        streak: streakData,
        time: timeAnalytics,
        performance: performanceAnalytics,
        velocity: learningVelocity,
        engagement: contentEngagement,
        totalSessions: sessions.length,
        lastUpdated: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error getting comprehensive analytics:', error);
    return { success: false, error: error.message };
  }
};
