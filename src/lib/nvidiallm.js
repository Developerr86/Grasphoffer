import OpenAI from 'openai';

/**
 * Initialize OpenAI client configured for Nvidia API
 * Uses REACT_APP_NVIDIA_API_KEY and REACT_APP_NVIDIA_MODEL from environment
 */
const getNvidiaClient = () => {
  const apiKey = process.env.REACT_APP_NVIDIA_API_KEY;
  const model = process.env.REACT_APP_NVIDIA_MODEL;

  if (!apiKey) {
    console.error('REACT_APP_NVIDIA_API_KEY is not configured in .env');
    throw new Error('Nvidia API key is not configured');
  }

  if (!model) {
    console.error('REACT_APP_NVIDIA_MODEL is not configured in .env');
    throw new Error('Nvidia model is not configured');
  }

  return new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://integrate.api.nvidia.com/v1',
    defaultHeaders: {
      'User-Agent': 'Grasphoffer/1.0'
    }
  });
};

/**
 * Generate a response using Nvidia-powered OpenAI API
 * @param {string} message - The user message or prompt
 * @param {Array} conversationHistory - Previous messages for context
 * @param {Object} options - Additional options (temperature, max_tokens, etc.)
 * @returns {Promise<string>} Generated response
 */
export const generateNvidiaResponse = async (
  message,
  conversationHistory = [],
  options = {}
) => {
  try {
    const client = getNvidiaClient();
    const model = process.env.REACT_APP_NVIDIA_MODEL;

    const messages = [
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    const response = await client.chat.completions.create({
      model: model,
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1024,
      top_p: options.top_p || 0.9,
      ...options
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating response with Nvidia LLM:', error);
    throw error;
  }
};

/**
 * Generate multiple completions for comparison
 * @param {string} prompt - The prompt
 * @param {number} count - Number of completions to generate
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of generated responses
 */
export const generateNvidiaCompletions = async (
  prompt,
  count = 1,
  options = {}
) => {
  try {
    const client = getNvidiaClient();
    const model = process.env.REACT_APP_NVIDIA_MODEL;

    const response = await client.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      n: count,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 512,
      ...options
    });

    return response.choices.map(choice => choice.message.content);
  } catch (error) {
    console.error('Error generating completions with Nvidia LLM:', error);
    throw error;
  }
};

/**
 * Generate structured data using Nvidia LLM
 * @param {string} prompt - The prompt
 * @param {string} format - Expected format (json, yaml, etc.)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Parsed structured data
 */
export const generateNvidiaStructured = async (
  prompt,
  format = 'json',
  options = {}
) => {
  try {
    const response = await generateNvidiaResponse(
      `${prompt}\n\nPlease respond in ${format.toUpperCase()} format only, with no additional text.`,
      [],
      options
    );

    if (format.toLowerCase() === 'json') {
      return JSON.parse(response);
    }
    return response;
  } catch (error) {
    console.error(`Error generating ${format} with Nvidia LLM:`, error);
    throw error;
  }
};

export default {
  generateNvidiaResponse,
  generateNvidiaCompletions,
  generateNvidiaStructured
};
