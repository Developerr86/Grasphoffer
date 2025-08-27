/**
 * Achievement System Service
 * Manages user achievements, badges, and milestones
 */

/**
 * Define all available achievements
 */
export const ACHIEVEMENTS = {
  // Study Streak Achievements
  FIRST_SESSION: {
    id: 'first_session',
    name: 'Getting Started',
    description: 'Complete your first learning session',
    icon: '🎯',
    category: 'milestone',
    requirement: (analytics) => analytics.totalSessions >= 1
  },
  STREAK_3: {
    id: 'streak_3',
    name: 'Consistent Learner',
    description: 'Study for 3 days in a row',
    icon: '🔥',
    category: 'streak',
    requirement: (analytics) => analytics.streak.currentStreak >= 3
  },
  STREAK_7: {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Study for 7 days in a row',
    icon: '⚡',
    category: 'streak',
    requirement: (analytics) => analytics.streak.currentStreak >= 7
  },
  STREAK_30: {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Study for 30 days in a row',
    icon: '👑',
    category: 'streak',
    requirement: (analytics) => analytics.streak.currentStreak >= 30
  },

  // Session Count Achievements
  SESSIONS_10: {
    id: 'sessions_10',
    name: 'Dedicated Student',
    description: 'Complete 10 learning sessions',
    icon: '📚',
    category: 'milestone',
    requirement: (analytics) => analytics.totalSessions >= 10
  },
  SESSIONS_50: {
    id: 'sessions_50',
    name: 'Learning Enthusiast',
    description: 'Complete 50 learning sessions',
    icon: '🎓',
    category: 'milestone',
    requirement: (analytics) => analytics.totalSessions >= 50
  },
  SESSIONS_100: {
    id: 'sessions_100',
    name: 'Knowledge Seeker',
    description: 'Complete 100 learning sessions',
    icon: '🏆',
    category: 'milestone',
    requirement: (analytics) => analytics.totalSessions >= 100
  },

  // Performance Achievements
  PERFECT_SCORE: {
    id: 'perfect_score',
    name: 'Perfectionist',
    description: 'Score 100% on a learning session',
    icon: '💯',
    category: 'performance',
    requirement: (analytics) => analytics.performance.recentPerformance.some(p => p.score === 100)
  },
  HIGH_PERFORMER: {
    id: 'high_performer',
    name: 'High Performer',
    description: 'Maintain an average score above 85%',
    icon: '⭐',
    category: 'performance',
    requirement: (analytics) => {
      const recentScores = analytics.performance.recentPerformance.map(p => p.score);
      const average = recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 0;
      return average >= 85 && recentScores.length >= 5;
    }
  },
  IMPROVEMENT_MASTER: {
    id: 'improvement_master',
    name: 'Improvement Master',
    description: 'Show 20% improvement in recent sessions',
    icon: '📈',
    category: 'performance',
    requirement: (analytics) => analytics.performance.improvementTrend >= 20
  },

  // Study Time Achievements
  STUDY_TIME_10H: {
    id: 'study_time_10h',
    name: 'Time Investor',
    description: 'Study for 10 hours total',
    icon: '⏰',
    category: 'time',
    requirement: (analytics) => analytics.time.totalStudyTime >= 600 // 10 hours in minutes
  },
  STUDY_TIME_50H: {
    id: 'study_time_50h',
    name: 'Dedicated Scholar',
    description: 'Study for 50 hours total',
    icon: '📖',
    category: 'time',
    requirement: (analytics) => analytics.time.totalStudyTime >= 3000 // 50 hours in minutes
  },
  MARATHON_SESSION: {
    id: 'marathon_session',
    name: 'Marathon Learner',
    description: 'Complete a session longer than 60 minutes',
    icon: '🏃‍♂️',
    category: 'time',
    requirement: (analytics) => analytics.time.averageSessionDuration >= 60
  },

  // Learning Method Achievements
  FAST_LEARNER: {
    id: 'fast_learner',
    name: 'Speed Demon',
    description: 'Complete 10 Fast Learning sessions',
    icon: '💨',
    category: 'method',
    requirement: (analytics) => {
      // This would need session type data
      return false; // Placeholder
    }
  },
  DEPTH_EXPLORER: {
    id: 'depth_explorer',
    name: 'Deep Thinker',
    description: 'Complete 10 Depth Learning sessions',
    icon: '🌊',
    category: 'method',
    requirement: (analytics) => {
      // This would need session type data
      return false; // Placeholder
    }
  },
  BALANCED_LEARNER: {
    id: 'balanced_learner',
    name: 'Balanced Approach',
    description: 'Use both Fast and Depth learning methods equally',
    icon: '⚖️',
    category: 'method',
    requirement: (analytics) => analytics.engagement.preferredLearningMethod === 'balanced'
  },

  // Special Achievements
  TOPIC_MASTER: {
    id: 'topic_master',
    name: 'Topic Master',
    description: 'Study the same topic 5 times',
    icon: '🎯',
    category: 'special',
    requirement: (analytics) => {
      return analytics.engagement.mostStudiedTopic && analytics.engagement.mostStudiedTopic.count >= 5;
    }
  },
  COMEBACK_KID: {
    id: 'comeback_kid',
    name: 'Comeback Kid',
    description: 'Return to studying after a 7-day break',
    icon: '🔄',
    category: 'special',
    requirement: (analytics) => {
      // This would need more complex logic to detect breaks
      return false; // Placeholder
    }
  }
};

/**
 * Calculate user's earned achievements
 * @param {Object} analytics - User analytics data
 * @returns {Object} Earned and available achievements
 */
export const calculateAchievements = (analytics) => {
  const earned = [];
  const available = [];
  const locked = [];

  Object.values(ACHIEVEMENTS).forEach(achievement => {
    try {
      if (achievement.requirement(analytics)) {
        earned.push({
          ...achievement,
          earnedAt: new Date().toISOString() // In a real app, this would be stored
        });
      } else {
        // Check if achievement is close to being earned
        const progress = calculateAchievementProgress(achievement, analytics);
        if (progress > 0) {
          available.push({
            ...achievement,
            progress
          });
        } else {
          locked.push(achievement);
        }
      }
    } catch (error) {
      console.error(`Error checking achievement ${achievement.id}:`, error);
      locked.push(achievement);
    }
  });

  return {
    earned: earned.sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt)),
    available: available.sort((a, b) => b.progress - a.progress),
    locked: locked,
    totalEarned: earned.length,
    totalAvailable: Object.keys(ACHIEVEMENTS).length
  };
};

/**
 * Calculate progress towards an achievement
 * @param {Object} achievement - Achievement definition
 * @param {Object} analytics - User analytics data
 * @returns {number} Progress percentage (0-100)
 */
export const calculateAchievementProgress = (achievement, analytics) => {
  switch (achievement.id) {
    case 'first_session':
      return Math.min(analytics.totalSessions / 1 * 100, 100);
    
    case 'streak_3':
      return Math.min(analytics.streak.currentStreak / 3 * 100, 100);
    
    case 'streak_7':
      return Math.min(analytics.streak.currentStreak / 7 * 100, 100);
    
    case 'streak_30':
      return Math.min(analytics.streak.currentStreak / 30 * 100, 100);
    
    case 'sessions_10':
      return Math.min(analytics.totalSessions / 10 * 100, 100);
    
    case 'sessions_50':
      return Math.min(analytics.totalSessions / 50 * 100, 100);
    
    case 'sessions_100':
      return Math.min(analytics.totalSessions / 100 * 100, 100);
    
    case 'study_time_10h':
      return Math.min(analytics.time.totalStudyTime / 600 * 100, 100);
    
    case 'study_time_50h':
      return Math.min(analytics.time.totalStudyTime / 3000 * 100, 100);
    
    case 'marathon_session':
      return Math.min(analytics.time.averageSessionDuration / 60 * 100, 100);
    
    case 'high_performer':
      const recentScores = analytics.performance.recentPerformance.map(p => p.score);
      const average = recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 0;
      return Math.min(average / 85 * 100, 100);
    
    case 'improvement_master':
      return Math.min(Math.max(analytics.performance.improvementTrend, 0) / 20 * 100, 100);
    
    case 'topic_master':
      const topicCount = analytics.engagement.mostStudiedTopic ? analytics.engagement.mostStudiedTopic.count : 0;
      return Math.min(topicCount / 5 * 100, 100);
    
    default:
      return 0;
  }
};

/**
 * Get achievement categories for organization
 * @returns {Array} Achievement categories
 */
export const getAchievementCategories = () => {
  return [
    { id: 'milestone', name: 'Milestones', icon: '🎯', color: '#667eea' },
    { id: 'streak', name: 'Study Streaks', icon: '🔥', color: '#f59e0b' },
    { id: 'performance', name: 'Performance', icon: '⭐', color: '#10b981' },
    { id: 'time', name: 'Study Time', icon: '⏰', color: '#8b5cf6' },
    { id: 'method', name: 'Learning Methods', icon: '🎓', color: '#ef4444' },
    { id: 'special', name: 'Special', icon: '🏆', color: '#f97316' }
  ];
};

/**
 * Get user's learning level based on achievements and analytics
 * @param {Object} achievements - User's achievements
 * @param {Object} analytics - User analytics data
 * @returns {Object} User level information
 */
export const calculateUserLevel = (achievements, analytics) => {
  const totalPoints = achievements.earned.length * 10 + analytics.totalSessions * 2;
  
  const levels = [
    { level: 1, name: 'Beginner', minPoints: 0, maxPoints: 49, icon: '🌱' },
    { level: 2, name: 'Student', minPoints: 50, maxPoints: 149, icon: '📚' },
    { level: 3, name: 'Scholar', minPoints: 150, maxPoints: 299, icon: '🎓' },
    { level: 4, name: 'Expert', minPoints: 300, maxPoints: 499, icon: '🧠' },
    { level: 5, name: 'Master', minPoints: 500, maxPoints: 999, icon: '👑' },
    { level: 6, name: 'Grandmaster', minPoints: 1000, maxPoints: Infinity, icon: '🏆' }
  ];

  const currentLevel = levels.find(l => totalPoints >= l.minPoints && totalPoints <= l.maxPoints) || levels[0];
  const nextLevel = levels.find(l => l.level === currentLevel.level + 1);
  
  const progressToNext = nextLevel ? 
    ((totalPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100 : 100;

  return {
    currentLevel,
    nextLevel,
    totalPoints,
    progressToNext: Math.min(progressToNext, 100),
    pointsToNext: nextLevel ? nextLevel.minPoints - totalPoints : 0
  };
};
