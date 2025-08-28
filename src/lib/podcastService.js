/**
 * Podcast Service
 * Handles podcast script generation and text-to-speech conversion
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase';
import { generatePodcastAudioWithGemini } from './geminiTTS';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEYY);

/**
 * Get all topics the user has engaged with
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of topics
 */
export const getUserTopics = async (userId) => {
  try {
    console.log('Fetching user topics for podcast generation...');

    // Get topics from learning sessions
    const { data: sessions, error: sessionError } = await supabase
      .from('learning_sessions')
      .select('topic, created_at, final_score')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (sessionError) {
      console.error('Error fetching sessions:', sessionError);
      return [];
    }

    // Get topics from uploaded documents
    const { data: documents, error: docError } = await supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (docError) {
      console.error('Error fetching documents:', docError);
    }

    // Combine and deduplicate topics
    const topics = new Set();
    const topicDetails = [];

    // Add session topics
    sessions?.forEach(session => {
      if (session.topic && !topics.has(session.topic.toLowerCase())) {
        topics.add(session.topic.toLowerCase());
        topicDetails.push({
          id: `session_${session.topic}`,
          title: session.topic,
          type: 'Learning Session',
          date: session.created_at,
          score: session.final_score,
          source: 'session'
        });
      }
    });

    // Add document topics (extract from filename)
    documents?.forEach(doc => {
      // Handle different possible column names
      const fileName = doc.name || doc.file_name || doc.filename || 'Unknown Document';
      const topicName = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
      if (!topics.has(topicName.toLowerCase())) {
        topics.add(topicName.toLowerCase());
        topicDetails.push({
          id: `doc_${topicName}`,
          title: topicName,
          type: 'Document',
          date: doc.created_at || doc.uploaded_at,
          source: 'document'
        });
      }
    });

    console.log(`Found ${topicDetails.length} unique topics for podcasts`);
    return topicDetails;

  } catch (error) {
    console.error('Error getting user topics:', error);
    return [];
  }
};

/**
 * Generate podcast script using Gemini 2.0 Flash
 * @param {string} topic - Topic for the podcast
 * @param {string} userId - User ID for context
 * @returns {Promise<Object>} Podcast script with speakers
 */
export const generatePodcastScript = async (topic, userId) => {
  try {
    console.log(`Generating podcast script for topic: ${topic}`);

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
Create an engaging 5-7 minute podcast script about "${topic}" between two speakers:

**Speaker A (Host)**: Sarah - An enthusiastic educator who asks great questions
**Speaker B (Expert)**: Dr. Alex - A knowledgeable expert who explains concepts clearly

Requirements:
1. Make it conversational and engaging
2. Include practical examples and real-world applications
3. Break down complex concepts into digestible parts
4. Add natural transitions and reactions
5. Include 2-3 key takeaways
6. Keep each speaker turn to 2-3 sentences max for natural flow
7. Total script should be about 800-1200 words

Format the response as JSON:
{
  "title": "Podcast title",
  "duration": "estimated duration",
  "speakers": {
    "host": "Sarah",
    "expert": "Dr. Alex"
  },
  "script": [
    {
      "speaker": "Sarah",
      "text": "Welcome to Learning Insights! Today we're diving into..."
    },
    {
      "speaker": "Dr. Alex", 
      "text": "Thanks for having me, Sarah. This is such an important topic because..."
    }
  ],
  "keyTakeaways": [
    "Key point 1",
    "Key point 2", 
    "Key point 3"
  ]
}

Topic: ${topic}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse podcast script JSON');
    }

    const podcastData = JSON.parse(jsonMatch[0]);
    
    console.log(`Generated podcast script with ${podcastData.script.length} segments`);
    return podcastData;

  } catch (error) {
    console.error('Error generating podcast script:', error);
    throw new Error(`Failed to generate podcast script: ${error.message}`);
  }
};

/**
 * Convert text to speech using Web Speech API
 * @param {string} text - Text to convert
 * @param {Object} options - Voice options
 * @returns {Promise<Blob>} Audio blob
 */
export const textToSpeech = async (text, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice options
    utterance.rate = options.rate || 0.9;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;

    // Set voice if specified
    if (options.voiceName) {
      const voices = speechSynthesis.getVoices();
      const voice = voices.find(v => v.name.includes(options.voiceName));
      if (voice) utterance.voice = voice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (error) => reject(error);

    speechSynthesis.speak(utterance);
  });
};

/**
 * Generate complete podcast audio from script using Gemini TTS
 * @param {Object} podcastScript - Podcast script object
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Audio data and metadata
 */
export const generatePodcastAudio = async (podcastScript, onProgress = null) => {
  // Use Gemini TTS for high-quality audio generation
  return await generatePodcastAudioWithGemini(podcastScript, onProgress);
};

/**
 * Get available voices for text-to-speech
 * @returns {Array} Available voices
 */
export const getAvailableVoices = () => {
  if (!('speechSynthesis' in window)) {
    return [];
  }

  return speechSynthesis.getVoices().map(voice => ({
    name: voice.name,
    lang: voice.lang,
    gender: voice.name.toLowerCase().includes('female') ? 'female' : 'male'
  }));
};
