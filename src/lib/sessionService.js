import { supabase } from './supabase';

/**
 * Session Service for managing learning sessions in Supabase
 */

/**
 * Create a new learning session
 * @param {Object} sessionData - Session data
 * @param {string} sessionData.sessionType - 'fast' or 'depth'
 * @param {string} sessionData.topic - The learning topic
 * @param {Array} sessionData.flashcards - Array of flashcard objects
 * @param {Array} sessionData.mcqQuestions - Array of MCQ question objects
 * @param {Object} sessionData.prerequisites - Prerequisites data (for depth sessions)
 * @returns {Promise<Object>} Created session data
 */
export const createSession = async (sessionData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const sessionRecord = {
      user_id: user.id,
      session_type: sessionData.sessionType,
      topic: sessionData.topic,
      status: 'in_progress',
      flashcards: sessionData.flashcards || [],
      mcq_questions: sessionData.mcqQuestions || [],
      total_flashcards: sessionData.flashcards?.length || 0,
      total_questions: sessionData.mcqQuestions?.length || 0,
      studied_flashcards: 0,
      correct_answers: 0,
      prerequisites: sessionData.prerequisites || null,
      prerequisite_results: null,
      core_concepts: sessionData.coreConcepts || null,
      advanced_concepts: sessionData.advancedConcepts || null
    };

    const { data, error } = await supabase
      .from('learning_sessions')
      .insert([sessionRecord])
      .select()
      .single();

    if (error) throw error;

    // Insert flashcards into session_flashcards table
    if (sessionData.flashcards && sessionData.flashcards.length > 0) {
      const flashcardRecords = sessionData.flashcards.map((card, index) => ({
        session_id: data.id,
        flashcard_index: index,
        question: card.question,
        answer: card.answer,
        is_studied: false
      }));

      const { error: flashcardError } = await supabase
        .from('session_flashcards')
        .insert(flashcardRecords);

      if (flashcardError) {
        console.error('Error inserting flashcards:', flashcardError);
      }
    }

    // Insert questions into session_questions table
    if (sessionData.mcqQuestions && sessionData.mcqQuestions.length > 0) {
      const questionRecords = sessionData.mcqQuestions.map((question, index) => ({
        session_id: data.id,
        question_index: index,
        question: question.question,
        options: question.options,
        correct_answer: question.correctAnswer,
        user_answer: null,
        is_correct: null,
        topic_category: question.topicCategory || 'General',
        difficulty_level: question.difficultyLevel || 'medium',
        explanation: question.explanation || '',
        why_wrong_explanation: question.whyWrongExplanation || ''
      }));

      const { error: questionError } = await supabase
        .from('session_questions')
        .insert(questionRecords);

      if (questionError) {
        console.error('Error inserting questions:', questionError);
      }
    }

    return { success: true, session: data };
  } catch (error) {
    console.error('Error creating session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update session progress
 * @param {string} sessionId - Session ID
 * @param {Object} progressData - Progress update data
 * @returns {Promise<Object>} Update result
 */
export const updateSessionProgress = async (sessionId, progressData) => {
  try {
    const updateData = {
      updated_at: new Date().toISOString()
    };

    // Add fields that are provided
    if (progressData.studiedFlashcards !== undefined) {
      updateData.studied_flashcards = progressData.studiedFlashcards;
    }
    if (progressData.correctAnswers !== undefined) {
      updateData.correct_answers = progressData.correctAnswers;
    }
    if (progressData.evaluationResults !== undefined) {
      updateData.evaluation_results = progressData.evaluationResults;
    }
    if (progressData.finalScore !== undefined) {
      updateData.final_score = progressData.finalScore;
    }
    if (progressData.status !== undefined) {
      updateData.status = progressData.status;
      if (progressData.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from('learning_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, session: data };
  } catch (error) {
    console.error('Error updating session progress:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark a flashcard as studied
 * @param {string} sessionId - Session ID
 * @param {number} flashcardIndex - Index of the flashcard
 * @returns {Promise<Object>} Update result
 */
export const markFlashcardStudied = async (sessionId, flashcardIndex) => {
  try {
    const { data, error } = await supabase
      .from('session_flashcards')
      .update({
        is_studied: true,
        study_time: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .eq('flashcard_index', flashcardIndex)
      .select()
      .single();

    if (error) throw error;

    return { success: true, flashcard: data };
  } catch (error) {
    console.error('Error marking flashcard as studied:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Record an answer to a question
 * @param {string} sessionId - Session ID
 * @param {number} questionIndex - Index of the question
 * @param {string} userAnswer - User's answer
 * @param {boolean} isCorrect - Whether the answer is correct
 * @returns {Promise<Object>} Update result
 */
export const recordQuestionAnswer = async (sessionId, questionIndex, userAnswer, isCorrect) => {
  try {
    const { data, error } = await supabase
      .from('session_questions')
      .update({
        user_answer: userAnswer,
        is_correct: isCorrect,
        answered_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .eq('question_index', questionIndex)
      .select()
      .single();

    if (error) throw error;

    return { success: true, question: data };
  } catch (error) {
    console.error('Error recording question answer:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get recent learning sessions for a user
 * @param {number} limit - Number of sessions to retrieve (default: 3)
 * @returns {Promise<Object>} Recent sessions
 */
export const getRecentSessions = async (limit = 3) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('learning_sessions')
      .select(`
        id,
        session_type,
        topic,
        status,
        total_flashcards,
        studied_flashcards,
        total_questions,
        correct_answers,
        final_score,
        created_at,
        completed_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, sessions: data || [] };
  } catch (error) {
    console.error('Error getting recent sessions:', error);
    return { success: false, error: error.message, sessions: [] };
  }
};

/**
 * Get a complete session with all its data
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Complete session data
 */
export const getSessionById = async (sessionId) => {
  try {
    // Get main session data
    const { data: session, error: sessionError } = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;

    // Get flashcards
    const { data: flashcards, error: flashcardError } = await supabase
      .from('session_flashcards')
      .select('*')
      .eq('session_id', sessionId)
      .order('flashcard_index');

    if (flashcardError) {
      console.error('Error getting flashcards:', flashcardError);
    }

    // Get questions
    const { data: questions, error: questionError } = await supabase
      .from('session_questions')
      .select('*')
      .eq('session_id', sessionId)
      .order('question_index');

    if (questionError) {
      console.error('Error getting questions:', questionError);
    }

    return {
      success: true,
      session: {
        ...session,
        flashcards: flashcards || [],
        questions: questions || []
      }
    };
  } catch (error) {
    console.error('Error getting session by ID:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Delete result
 */
export const deleteSession = async (sessionId) => {
  try {
    const { error } = await supabase
      .from('learning_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get session resume data with calculated state
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Resume data for the session
 */
export const getSessionResumeData = async (sessionId) => {
  try {
    // Get complete session data
    const sessionResult = await getSessionById(sessionId);
    if (!sessionResult.success) {
      throw new Error(sessionResult.error);
    }

    const session = sessionResult.session;

    // Calculate studied cards set
    const studiedCards = new Set(
      session.flashcards
        .filter(card => card.is_studied)
        .map(card => card.flashcard_index)
    );

    // Calculate current card index (next unstudied card)
    let currentCardIndex = 0;
    for (let i = 0; i < session.flashcards.length; i++) {
      if (!studiedCards.has(i)) {
        currentCardIndex = i;
        break;
      }
    }

    // If all cards are studied, set to last card
    if (studiedCards.size === session.flashcards.length && session.flashcards.length > 0) {
      currentCardIndex = session.flashcards.length - 1;
    }

    // Determine current phase based on progress
    let currentPhase = 'flashcards';

    if (session.session_type === 'fast') {
      if (session.status === 'completed') {
        currentPhase = 'completed';
      } else if (studiedCards.size === session.total_flashcards && session.total_flashcards > 0) {
        currentPhase = 'evaluation';
      } else {
        currentPhase = 'flashcards';
      }
    } else if (session.session_type === 'depth') {
      // For depth sessions, we need to check prerequisite_results and other factors
      if (session.status === 'completed') {
        currentPhase = 'completed';
      } else if (session.prerequisite_results) {
        currentPhase = 'learning'; // or 'final-evaluation' based on learning progress
      } else if (session.prerequisites) {
        currentPhase = 'evaluation';
      } else {
        currentPhase = 'prerequisites';
      }
    }

    // Get answered questions
    const answeredQuestions = session.questions.filter(q => q.user_answer !== null);

    return {
      success: true,
      resumeData: {
        sessionId: session.id,
        sessionType: session.session_type,
        topic: session.topic,
        currentPhase,

        // Flashcard data
        flashcards: session.flashcards.map(card => ({
          question: card.question,
          answer: card.answer
        })),
        studiedCards,
        currentCardIndex,

        // Question data
        questions: session.questions.map(q => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correct_answer
        })),
        answeredQuestions: answeredQuestions.map(q => ({
          questionIndex: q.question_index,
          userAnswer: q.user_answer,
          isCorrect: q.is_correct
        })),

        // Session metadata
        totalFlashcards: session.total_flashcards,
        studiedFlashcardsCount: session.studied_flashcards,
        totalQuestions: session.total_questions,
        correctAnswers: session.correct_answers,

        // Depth session specific data
        prerequisites: session.prerequisites,
        prerequisiteResults: session.prerequisite_results,
        coreConcepts: session.core_concepts,
        advancedConcepts: session.advanced_concepts,
        evaluationResults: session.evaluation_results
      }
    };
  } catch (error) {
    console.error('Error getting session resume data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update session phase and related data
 * @param {string} sessionId - Session ID
 * @param {string} phase - Current phase
 * @param {Object} phaseData - Phase-specific data
 * @returns {Promise<Object>} Update result
 */
export const updateSessionPhase = async (sessionId, phase, phaseData = {}) => {
  try {
    const updateData = {
      updated_at: new Date().toISOString(),
      ...phaseData
    };

    // Store phase information in evaluation_results for now
    // (we could add a dedicated phase field in future schema updates)
    if (phase) {
      updateData.evaluation_results = {
        ...updateData.evaluation_results,
        currentPhase: phase,
        phaseData: phaseData
      };
    }

    const { data, error } = await supabase
      .from('learning_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, session: data };
  } catch (error) {
    console.error('Error updating session phase:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Save current session state for resuming later
 * @param {string} sessionId - Session ID
 * @param {Object} sessionState - Current session state
 * @returns {Promise<Object>} Save result
 */
export const saveSessionState = async (sessionId, sessionState) => {
  try {
    const updateData = {
      updated_at: new Date().toISOString(),
      evaluation_results: {
        ...sessionState,
        lastSaved: new Date().toISOString()
      }
    };

    const { data, error } = await supabase
      .from('learning_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, session: data };
  } catch (error) {
    console.error('Error saving session state:', error);
    return { success: false, error: error.message };
  }
};
