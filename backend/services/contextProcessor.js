/**
 * Context Processing Service
 * Processes user context, extracts learning stats, and formats data for RAG
 */

/**
 * Process context and extract learning statistics
 * @param {string} context - Raw context markdown from user documents and flashcards
 * @param {Array} weakConcepts - Array of weak concepts
 * @returns {Object} Processed context with stats
 */
async function processContext(context, weakConcepts = []) {
  try {
    console.log('Processing context for RAG...');
    
    // Extract learning statistics from context
    const stats = extractLearningStats(context);
    
    // Get top 4 most relevant context sections
    const topContext = await getTopRelevantContext(context, 4);
    
    return {
      context: topContext,
      weakConcepts: weakConcepts,
      Stats: [
        stats.areasOfDifficulty,
        stats.learningProgressSummary
      ]
    };
    
  } catch (error) {
    console.error('Error processing context:', error);
    throw new Error('Failed to process context');
  }
}

/**
 * Extract learning statistics from context markdown
 * @param {string} context - Context markdown content
 * @returns {Object} Learning statistics
 */
function extractLearningStats(context) {
  const stats = {
    areasOfDifficulty: [],
    learningProgressSummary: []
  };

  try {
    // Extract areas of difficulty
    const difficultyPatterns = [
      /## Areas of Difficulty[\s\S]*?(?=##|$)/gi,
      /## Struggling Topics[\s\S]*?(?=##|$)/gi,
      /## Weak Areas[\s\S]*?(?=##|$)/gi,
      /\*\*Difficulty:\*\*\s*([^\n]+)/gi,
      /\*\*Struggling with:\*\*\s*([^\n]+)/gi
    ];

    difficultyPatterns.forEach(pattern => {
      const matches = context.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const topics = extractTopicsFromText(match);
          stats.areasOfDifficulty.push(...topics);
        });
      }
    });

    // Extract learning progress information
    const progressPatterns = [
      /## Learning Progress[\s\S]*?(?=##|$)/gi,
      /## Session Summary[\s\S]*?(?=##|$)/gi,
      /## Completed Topics[\s\S]*?(?=##|$)/gi,
      /\*\*Progress:\*\*\s*([^\n]+)/gi,
      /\*\*Completed:\*\*\s*([^\n]+)/gi,
      /\*\*Score:\*\*\s*([^\n]+)/gi
    ];

    progressPatterns.forEach(pattern => {
      const matches = context.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const progressInfo = extractProgressFromText(match);
          stats.learningProgressSummary.push(...progressInfo);
        });
      }
    });

    // Extract from flashcards and sessions
    const flashcardStats = extractFlashcardStats(context);
    const sessionStats = extractSessionStats(context);

    // Merge all stats
    stats.areasOfDifficulty = [...new Set([
      ...stats.areasOfDifficulty,
      ...flashcardStats.difficulties,
      ...sessionStats.difficulties
    ])].slice(0, 10); // Limit to top 10

    stats.learningProgressSummary = [...new Set([
      ...stats.learningProgressSummary,
      ...flashcardStats.progress,
      ...sessionStats.progress
    ])].slice(0, 10); // Limit to top 10

    console.log('Extracted learning stats:', {
      difficultiesCount: stats.areasOfDifficulty.length,
      progressCount: stats.learningProgressSummary.length
    });

    return stats;

  } catch (error) {
    console.error('Error extracting learning stats:', error);
    return {
      areasOfDifficulty: [],
      learningProgressSummary: []
    };
  }
}

/**
 * Extract topics from text content
 * @param {string} text - Text to extract topics from
 * @returns {Array} Array of topics
 */
function extractTopicsFromText(text) {
  const topics = [];
  
  // Extract bullet points
  const bulletPoints = text.match(/[-•*]\s*([^\n]+)/g);
  if (bulletPoints) {
    bulletPoints.forEach(point => {
      const topic = point.replace(/[-•*]\s*/, '').trim();
      if (topic && topic.length > 3) {
        topics.push(topic);
      }
    });
  }

  // Extract numbered lists
  const numberedItems = text.match(/\d+\.\s*([^\n]+)/g);
  if (numberedItems) {
    numberedItems.forEach(item => {
      const topic = item.replace(/\d+\.\s*/, '').trim();
      if (topic && topic.length > 3) {
        topics.push(topic);
      }
    });
  }

  // Extract bold text (likely important concepts)
  const boldText = text.match(/\*\*([^*]+)\*\*/g);
  if (boldText) {
    boldText.forEach(bold => {
      const topic = bold.replace(/\*\*/g, '').trim();
      if (topic && topic.length > 3 && !topic.includes(':')) {
        topics.push(topic);
      }
    });
  }

  return topics.filter(topic => topic.length > 3 && topic.length < 100);
}

/**
 * Extract progress information from text
 * @param {string} text - Text to extract progress from
 * @returns {Array} Array of progress items
 */
function extractProgressFromText(text) {
  const progress = [];
  
  // Extract completion percentages
  const percentages = text.match(/(\d+)%/g);
  if (percentages) {
    percentages.forEach(percent => {
      progress.push(`Completion rate: ${percent}`);
    });
  }

  // Extract scores
  const scores = text.match(/score[:\s]*(\d+(?:\.\d+)?)/gi);
  if (scores) {
    scores.forEach(score => {
      progress.push(`Learning ${score.toLowerCase()}`);
    });
  }

  // Extract session counts
  const sessions = text.match(/(\d+)\s*sessions?/gi);
  if (sessions) {
    sessions.forEach(session => {
      progress.push(`Completed ${session.toLowerCase()}`);
    });
  }

  return progress;
}

/**
 * Extract statistics from flashcard content
 * @param {string} context - Context containing flashcard data
 * @returns {Object} Flashcard statistics
 */
function extractFlashcardStats(context) {
  const stats = { difficulties: [], progress: [] };

  // Look for flashcard sections
  const flashcardSections = context.match(/## Generated Flashcards[\s\S]*?(?=##|$)/gi);
  
  if (flashcardSections) {
    flashcardSections.forEach(section => {
      // Count flashcards
      const flashcardCount = (section.match(/\*\*Q:\*\*/g) || []).length;
      if (flashcardCount > 0) {
        stats.progress.push(`Generated ${flashcardCount} flashcards`);
      }

      // Extract difficult concepts from flashcard questions
      const questions = section.match(/\*\*Q:\*\*\s*([^\n]+)/g);
      if (questions) {
        questions.forEach(q => {
          const question = q.replace(/\*\*Q:\*\*\s*/, '').trim();
          const concepts = extractConceptsFromQuestion(question);
          stats.difficulties.push(...concepts);
        });
      }
    });
  }

  return stats;
}

/**
 * Extract statistics from learning session content
 * @param {string} context - Context containing session data
 * @returns {Object} Session statistics
 */
function extractSessionStats(context) {
  const stats = { difficulties: [], progress: [] };

  // Look for session sections
  const sessionSections = context.match(/## Learning Sessions[\s\S]*?(?=##|$)/gi);
  
  if (sessionSections) {
    sessionSections.forEach(section => {
      // Extract session topics
      const topics = section.match(/\*\*Topic:\*\*\s*([^\n]+)/g);
      if (topics) {
        topics.forEach(topic => {
          const topicName = topic.replace(/\*\*Topic:\*\*\s*/, '').trim();
          stats.progress.push(`Studied: ${topicName}`);
        });
      }

      // Extract low scores (indicating difficulty)
      const scores = section.match(/\*\*Score:\*\*\s*(\d+(?:\.\d+)?)/g);
      if (scores) {
        scores.forEach(score => {
          const scoreValue = parseFloat(score.replace(/\*\*Score:\*\*\s*/, ''));
          if (scoreValue < 70) {
            stats.difficulties.push(`Low performance area (${scoreValue}%)`);
          } else {
            stats.progress.push(`Good performance (${scoreValue}%)`);
          }
        });
      }
    });
  }

  return stats;
}

/**
 * Extract concepts from a question
 * @param {string} question - Question text
 * @returns {Array} Array of concepts
 */
function extractConceptsFromQuestion(question) {
  const concepts = [];
  
  // Simple concept extraction based on common patterns
  const patterns = [
    /what is ([^?]+)/gi,
    /define ([^?]+)/gi,
    /explain ([^?]+)/gi,
    /how does ([^?]+)/gi,
    /why is ([^?]+)/gi
  ];

  patterns.forEach(pattern => {
    const matches = question.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const concept = match.replace(pattern, '$1').trim();
        if (concept && concept.length > 3) {
          concepts.push(concept);
        }
      });
    }
  });

  return concepts;
}

/**
 * Get top K most relevant context sections
 * @param {string} context - Full context markdown
 * @param {number} k - Number of top sections to return
 * @returns {string} Top K context sections
 */
async function getTopRelevantContext(context, k = 4) {
  try {
    // Split context into sections
    const sections = context.split(/(?=##\s)/g).filter(section => section.trim().length > 0);

    if (sections.length <= k) {
      return context; // Return all if we have fewer sections than requested
    }

    // Simple approach: return first K sections
    // The embedding service will handle semantic similarity at the RAG level
    const topSections = sections.slice(0, k);

    console.log(`Selected top ${topSections.length} context sections out of ${sections.length}`);

    return topSections.join('\n\n');

  } catch (error) {
    console.error('Error getting top relevant context:', error);
    return context; // Fallback to full context
  }
}

module.exports = {
  processContext,
  extractLearningStats,
  getTopRelevantContext
};
