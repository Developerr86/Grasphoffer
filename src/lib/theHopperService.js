/**
 * TheHopper Service
 *
 * TheHopper's RAG backend has been removed. The chatbot is temporarily
 * disabled. The functions below return appropriate placeholder/disabled
 * responses so that any component relying on this service continues to
 * compile and render gracefully.
 */

/**
 * Prepare comprehensive learning context for TheHopper.
 * Returns an empty placeholder — no backend call is made.
 */
export const prepareLearningContext = async (userId) => {
  return {
    success: true,
    contextContent: '',
    Stats: [[], []],
    metadata: {
      documentCount: 0,
      flashcardCount: 0,
      struggleCount: 0,
      sessionCount: 0,
      hasContent: false,
    },
  };
};

/**
 * TheHopper chatbot — temporarily disabled.
 * Returns a user-friendly disabled message instead of calling any API.
 */
export const callTheHopper = async (
  question,
  context,
  weakConcepts = [],
  Stats = [[], []],
  onProgress = null
) => {
  // Signal completion to any progress listeners
  if (onProgress && typeof onProgress === 'function') {
    onProgress({ status: 'completed', progress: 100, message: 'Done' });
  }

  return {
    success: true,
    answer:
      '**TheHopper is temporarily unavailable.** The AI assistant is being upgraded. Please check back soon!',
    citations: [],
    themes: '',
    processingTime: 0,
    source: 'DISABLED',
  };
};

/**
 * Get user's learning insights.
 * Returns empty placeholder — no backend call is made.
 */
export const getLearningInsights = async (userId) => {
  return {
    success: true,
    insights: {
      recentSessions: [],
      struggles: [],
      progress: [],
      totalSessions: 0,
      totalStruggles: 0,
      activeAreas: 0,
    },
  };
};