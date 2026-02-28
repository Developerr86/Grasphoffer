/**
 * TheHopper Service - Handles RAG chatbot functionality
 * This service prepares context and calls the Groq API for intelligent responses
 */

/**
 * Prepare comprehensive learning context for TheHopper
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Context data and metadata
 */
export const prepareLearningContext = async (userId) => {
  try {
    console.log('[PLACEHOLDER] Preparing learning context for user:', userId);

    // Return placeholder context since tables have been dropped
    const contextContent = `# User Learning Context

## Uploaded Documents
No documents uploaded yet.

## Generated Flashcards
No flashcards generated yet.

## Areas of Difficulty
No learning struggles recorded yet.

## Learning Progress Summary
- Total Documents: 0
- Total Flashcards: 0
- Areas of Difficulty: 0
- Recent Sessions: 0
`;

    return {
      success: true,
      contextContent,
      Stats: [[], []], // [areasOfDifficulty, learningProgressSummary]
      metadata: {
        documentCount: 0,
        flashcardCount: 0,
        struggleCount: 0,
        sessionCount: 0,
        hasContent: false
      }
    };

  } catch (error) {
    console.error('Error preparing learning context:', error);
    return {
      success: false,
      error: error.message,
      contextContent: '',
      Stats: [[], []],
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
 * Call TheHopper API with question and context (Async processing)
 * @param {string} question - User's question
 * @param {string} context - Learning context
 * @param {Array} weakConcepts - User's weak areas
 * @param {Array} Stats - Learning statistics [areasOfDifficulty, learningProgress]
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<Object>} TheHopper response
 */
export const callTheHopper = async (question, context, weakConcepts = [], Stats = [[], []], onProgress = null) => {
  try {
    console.log('Calling TheHopper with question:', question);
    console.log('Context:', context);
    console.log('Weak Concepts:', weakConcepts);
    console.log('Stats:', Stats);

    // Backend API endpoint (adjust URL based on your setup)
    const apiUrl = process.env.REACT_APP_THEHOPPER_API_URL || 'http://localhost:3002';

    console.log('=== API CALL DEBUG ===');
    console.log('Environment variable REACT_APP_THEHOPPER_API_URL:', process.env.REACT_APP_THEHOPPER_API_URL);
    console.log('Final API URL:', apiUrl);
    console.log('Full endpoint:', `${apiUrl}/api/thehopper/ask`);
    console.log('=== END API DEBUG ===');

    // Step 1: Submit the question and get request ID
    const submitResponse = await fetch(`${apiUrl}/api/thehopper/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        context,
        weakConcepts,
        Stats
      })
    });

    if (!submitResponse.ok) {
      console.error('=== API SUBMIT ERROR ===');
      console.error('Status:', submitResponse.status);
      console.error('Status Text:', submitResponse.statusText);
      console.error('URL:', submitResponse.url);
      console.error('=== END SUBMIT ERROR ===');
      throw new Error(`HTTP error! status: ${submitResponse.status}`);
    }

    const submitResult = await submitResponse.json();

    if (!submitResult.success || !submitResult.requestId) {
      throw new Error('Failed to submit question to TheHopper');
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
        const statusResponse = await fetch(`${apiUrl}/api/thehopper/status/${requestId}`);

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
              const resultResponse = await fetch(`${apiUrl}/api/thehopper/result/${requestId}`);

              if (resultResponse.ok) {
                const result = await resultResponse.json();

                if (result.success) {
                  console.log('=== RAG RESPONSE RECEIVED ===');
                  console.log('Source:', result.source || 'RAG_SYSTEM');
                  console.log('Model:', result.model || 'Unknown');
                  console.log('Processing Time:', result.processingTime, 'ms');
                  console.log('Citations Count:', (result.citations || []).length);
                  console.log('Has Themes:', !!(result.themes || ''));
                  console.log('=== END OF RAG RESPONSE INFO ===');

                  return {
                    success: true,
                    answer: result.answer,
                    citations: result.citations || [],
                    themes: result.themes || '',
                    processingTime: result.processingTime,
                    source: result.source || 'RAG_SYSTEM',
                    model: result.model
                  };
                } else {
                  throw new Error(result.error || 'Failed to get response from TheHopper');
                }
              } else {
                throw new Error(`Failed to fetch result: ${resultResponse.status}`);
              }
            }

            // If failed, throw error
            if (status === 'failed') {
              const resultResponse = await fetch(`${apiUrl}/api/thehopper/result/${requestId}`);

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
    console.error('=== THEHOPPER API ERROR ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    console.error('=== END API ERROR ===');

    // No fallback - throw the error to be handled by the component
    throw new Error(`RAG Backend API Error: ${error.message}. Please ensure the backend server is running on the correct port.`);
  }
};

/**
 * Get user's learning insights for TheHopper
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Learning insights
 */
export const getLearningInsights = async (userId) => {
  try {
    console.log('[PLACEHOLDER] Getting learning insights for user:', userId);

    // Return placeholder insights since tables have been dropped
    return {
      success: true,
      insights: {
        recentSessions: [],
        struggles: [],
        progress: [],
        totalSessions: 0,
        totalStruggles: 0,
        activeAreas: 0
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