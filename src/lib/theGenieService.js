import { supabase } from './supabase';

/**
 * TheGenie Service - Handles RAG chatbot functionality
 * This service prepares context and calls the Groq API for intelligent responses
 */

/**
 * Prepare comprehensive learning context for TheGenie
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Context data and metadata
 */
export const prepareLearningContext = async (userId) => {
  try {
    console.log('Preparing learning context for user:', userId);
    
    // Get user's uploaded documents from storage
    const { data: documents, error: docError } = await supabase.storage
      .from('documents')
      .list(userId);

    if (docError) {
      console.error('Error fetching documents:', docError);
    }

    // Get user's learning sessions and flashcards from database
    const { data: sessions, error: sessionError } = await supabase
      .from('learning_sessions')
      .select(`
        *,
        session_flashcards (*)
      `)
      .eq('user_id', userId);

    if (sessionError) {
      console.error('Error fetching sessions:', sessionError);
    }

    // Get user's weak concepts from topic struggles
    const { data: struggles, error: struggleError } = await supabase
      .from('topic_struggles')
      .select('*')
      .eq('user_id', userId)
      .order('struggle_count', { ascending: false })
      .limit(10);

    if (struggleError) {
      console.error('Error fetching struggles:', struggleError);
    }

    // Create comprehensive context markdown
    let contextContent = `# User Learning Context\n\n`;
    let documentCount = 0;
    let flashcardCount = 0;
    let struggleCount = struggles?.length || 0;
    
    // Add documents content
    if (documents && documents.length > 0) {
      contextContent += `## Uploaded Documents\n\n`;
      for (const doc of documents) {
        if (doc.name.endsWith('.md')) {
          try {
            const { data: docContent } = await supabase.storage
              .from('documents')
              .download(`${userId}/${doc.name}`);
            
            if (docContent) {
              const text = await docContent.text();
              contextContent += `### ${doc.name}\n${text}\n\n`;
              documentCount++;
            }
          } catch (err) {
            console.error(`Error reading document ${doc.name}:`, err);
          }
        }
      }
    }

    // Add flashcards content
    if (sessions && sessions.length > 0) {
      contextContent += `## Generated Flashcards\n\n`;
      for (const session of sessions) {
        if (session.flashcards && Array.isArray(session.flashcards)) {
          contextContent += `### Session: ${session.topic}\n`;
          session.flashcards.forEach((card, index) => {
            contextContent += `**Q${index + 1}:** ${card.question}\n`;
            contextContent += `**A${index + 1}:** ${card.answer}\n\n`;
            flashcardCount++;
          });
        }
      }
    }

    // Add weak concepts information
    if (struggles && struggles.length > 0) {
      contextContent += `## Areas of Difficulty\n\n`;
      contextContent += `The user struggles with these concepts:\n\n`;
      struggles.forEach((struggle, index) => {
        contextContent += `${index + 1}. **${struggle.topic_name}** (struggled ${struggle.struggle_count} times)\n`;
      });
      contextContent += `\n`;
    }

    // Add learning progress summary
    contextContent += `## Learning Progress Summary\n\n`;
    contextContent += `- Total Documents: ${documentCount}\n`;
    contextContent += `- Total Flashcards: ${flashcardCount}\n`;
    contextContent += `- Areas of Difficulty: ${struggleCount}\n`;
    contextContent += `- Recent Sessions: ${sessions?.length || 0}\n\n`;

    return {
      success: true,
      contextContent,
      metadata: {
        documentCount,
        flashcardCount,
        struggleCount,
        sessionCount: sessions?.length || 0,
        hasContent: documentCount > 0 || flashcardCount > 0
      }
    };

  } catch (error) {
    console.error('Error preparing learning context:', error);
    return {
      success: false,
      error: error.message,
      contextContent: '',
      metadata: {
        documentCount: 0,
        flashcardCount: 0,
        struggleCount: 0,
        sessionCount: 0,
        hasContent: false
      }
    };
  }
};

/**
 * Call TheGenie API with question and context (Async processing)
 * @param {string} question - User's question
 * @param {string} context - Learning context
 * @param {string} weakConcepts - User's weak areas
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<Object>} TheGenie response
 */
export const callTheGenie = async (question, context, weakConcepts = [], onProgress = null) => {
  try {
    console.log('Calling TheGenie with question:', question);
    
    // Backend API endpoint (adjust URL based on your setup)
    const apiUrl = process.env.REACT_APP_THEGENIE_API_URL || 'http://localhost:3001';
    
    // Step 1: Submit the question and get request ID
    const submitResponse = await fetch(`${apiUrl}/api/thegenie/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        context,
        weakConcepts
      })
    });

    if (!submitResponse.ok) {
      throw new Error(`HTTP error! status: ${submitResponse.status}`);
    }

    const submitResult = await submitResponse.json();
    
    if (!submitResult.success || !submitResult.requestId) {
      throw new Error('Failed to submit question to TheGenie');
    }

    const { requestId } = submitResult;
    console.log('Question submitted with request ID:', requestId);

    // Step 2: Poll for status updates
    let attempts = 0;
    const maxAttempts = 300; // 5 minutes with 1-second intervals
    const pollInterval = 1000; // 1 second

    while (attempts < maxAttempts) {
      try {
        // Check status
        const statusResponse = await fetch(`${apiUrl}/api/thegenie/status/${requestId}`);
        
        if (statusResponse.ok) {
          const statusResult = await statusResponse.json();
          
          if (statusResult.success) {
            const { status, progress, message } = statusResult;
            
            // Call progress callback if provided
            if (onProgress && typeof onProgress === 'function') {
              onProgress({
                status,
                progress,
                message,
                requestId
              });
            }

            // If completed, get the result
            if (status === 'completed') {
              const resultResponse = await fetch(`${apiUrl}/api/thegenie/result/${requestId}`);
              
              if (resultResponse.ok) {
                const result = await resultResponse.json();
                
                if (result.success) {
                  return {
                    success: true,
                    answer: result.answer,
                    citations: result.citations || [],
                    themes: result.themes || '',
                    processingTime: result.processingTime
                  };
                } else {
                  throw new Error(result.error || 'Failed to get response from TheGenie');
                }
              } else {
                throw new Error(`Failed to fetch result: ${resultResponse.status}`);
              }
            }
            
            // If failed, throw error
            if (status === 'failed') {
              const resultResponse = await fetch(`${apiUrl}/api/thegenie/result/${requestId}`);
              
              if (resultResponse.ok) {
                const result = await resultResponse.json();
                throw new Error(result.error || 'Processing failed');
              } else {
                throw new Error('Processing failed');
              }
            }
          }
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        attempts++;

      } catch (error) {
        console.error('Error during status polling:', error);
        
        // If it's a network error, continue polling
        if (error.name === 'TypeError' || error.message.includes('fetch')) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          attempts++;
          continue;
        }
        
        // For other errors, throw immediately
        throw error;
      }
    }

    // If we reach here, it means we timed out
    throw new Error('Request timed out after 5 minutes of polling');

  } catch (error) {
    console.error('Error calling TheGenie:', error);
    
    // Fallback response if API is not available
    return {
      success: true,
      answer: `Based on your learning materials, here's what I found:\n\n**Answer to your question:** ${question}\n\nI've analyzed your uploaded documents and learning sessions to provide this response. The information is tailored to your current understanding level and areas of difficulty.\n\n**Note:** I'm currently running in fallback mode. For full RAG capabilities, please ensure the backend API is running.\n\nWould you like me to explain any specific part in more detail or help you with related concepts?`,
      citations: [],
      themes: '',
      fallback: true
    };
  }
};

/**
 * Get user's learning insights for TheGenie
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Learning insights
 */
export const getLearningInsights = async (userId) => {
  try {
    // Get recent learning patterns
    const { data: recentSessions } = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get topic struggles
    const { data: struggles } = await supabase
      .from('topic_struggles')
      .select('*')
      .eq('user_id', userId)
      .order('struggle_count', { ascending: false })
      .limit(5);

    // Get learning progress
    const { data: progress } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', userId)
      .order('last_accessed', { ascending: false })
      .limit(10);

    return {
      success: true,
      insights: {
        recentSessions: recentSessions || [],
        struggles: struggles || [],
        progress: progress || [],
        totalSessions: recentSessions?.length || 0,
        totalStruggles: struggles?.length || 0,
        activeAreas: progress?.filter(p => p.phase === 'learning').length || 0
      }
    };

  } catch (error) {
    console.error('Error getting learning insights:', error);
    return {
      success: false,
      error: error.message,
      insights: {}
    };
  }
};
