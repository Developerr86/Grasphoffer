/**
 * Podcast Service - PLACEHOLDER VERSION
 * LLM functionality removed, returns static data
 */

/**
 * Get all topics the user has engaged with
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of topics
 */
export const getUserTopics = async (userId) => {
  try {
    console.log('[PLACEHOLDER] Fetching user topics for podcast generation...');

    // Return placeholder topics since tables have been dropped
    const topicDetails = [
      {
        id: 'placeholder_1',
        title: 'Introduction to Programming',
        type: 'Sample Topic',
        date: new Date().toISOString(),
        source: 'placeholder'
      },
      {
        id: 'placeholder_2',
        title: 'Data Structures',
        type: 'Sample Topic',
        date: new Date().toISOString(),
        source: 'placeholder'
      },
      {
        id: 'placeholder_3',
        title: 'Web Development',
        type: 'Sample Topic',
        date: new Date().toISOString(),
        source: 'placeholder'
      }
    ];

    console.log(`[PLACEHOLDER] Returning ${topicDetails.length} sample topics for podcasts`);
    return topicDetails;

  } catch (error) {
    console.error('Error getting user topics:', error);
    return [];
  }
};

/**
 * Generate podcast script - PLACEHOLDER VERSION
 * @param {string} topic - Topic for the podcast
 * @param {string} userId - User ID for context
 * @returns {Promise<Object>} Podcast script with speakers
 */
export const generatePodcastScript = async (topic, userId) => {
  console.log(`[PLACEHOLDER] Generating podcast script for topic: ${topic}`);

  // Return static placeholder script
  return {
    title: `Learning Insights: ${topic}`,
    duration: "5-7 minutes",
    speakers: {
      host: "Sarah",
      expert: "Dr. Alex"
    },
    script: [
      {
        speaker: "Sarah",
        text: `Welcome to Learning Insights! Today we're diving into ${topic}. I'm really excited to explore this topic with you, Dr. Alex.`
      },
      {
        speaker: "Dr. Alex",
        text: `Thanks for having me, Sarah. ${topic} is such an important topic because it forms the foundation for understanding many related concepts.`
      },
      {
        speaker: "Sarah",
        text: "That's fascinating! Can you break down the key concepts for our listeners?"
      },
      {
        speaker: "Dr. Alex",
        text: `Absolutely. The fundamental principles of ${topic} involve several interconnected ideas that work together to create a comprehensive understanding.`
      },
      {
        speaker: "Sarah",
        text: "I see. And how does this apply in real-world scenarios?"
      },
      {
        speaker: "Dr. Alex",
        text: `Great question! ${topic} has numerous practical applications across various fields, making it essential knowledge for anyone interested in this area.`
      },
      {
        speaker: "Sarah",
        text: "Thank you so much for sharing your expertise with us today, Dr. Alex. This has been incredibly insightful!"
      },
      {
        speaker: "Dr. Alex",
        text: "My pleasure, Sarah. I hope our listeners found this helpful in their learning journey!"
      }
    ],
    keyTakeaways: [
      `Understanding ${topic} is fundamental to related concepts`,
      `${topic} has practical real-world applications`,
      `Building a strong foundation in ${topic} enables advanced learning`
    ]
  };
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
 * Generate complete podcast audio from script - PLACEHOLDER VERSION
 * @param {Object} podcastScript - Podcast script object
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Audio data and metadata
 */
export const generatePodcastAudio = async (podcastScript, onProgress = null) => {
  console.log('[PLACEHOLDER] generatePodcastAudio called');

  // Simulate progress
  if (onProgress) {
    onProgress({ progress: 0, message: 'Starting audio generation...' });
    await new Promise(resolve => setTimeout(resolve, 500));
    onProgress({ progress: 50, message: 'Processing audio...' });
    await new Promise(resolve => setTimeout(resolve, 500));
    onProgress({ progress: 100, message: 'Complete!' });
  }

  // Return placeholder audio data
  return {
    success: false,
    error: 'Audio generation is currently unavailable. This feature requires LLM integration.',
    audioUrl: null,
    duration: 0
  };
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
