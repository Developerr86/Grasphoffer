/**
 * Nvidia LLM Utility
 *
 * Calls /api/llm-chat — a relative URL that resolves to:
 *   • Local dev (npm start): handled by setupProxy.js express middleware
 *   • Vercel production:     handled by api/llm-chat.js serverless function
 *
 * No separate backend service is required.
 */

/**
 * Core call — sends messages to /api/llm-chat and returns response text.
 * @param {Array}  messages  OpenAI-format messages array
 * @param {Object} options   { temperature, max_tokens, top_p }
 * @returns {Promise<string>}
 */
const callLLM = async (messages, options = {}) => {
  const response = await fetch('/api/llm-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, options }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`LLM API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Unknown LLM error');
  }
  return data.content ?? '';
};

/**
 * Generate a single chat response.
 * @param {string} message              User message / prompt
 * @param {Array}  conversationHistory  Previous messages for context
 * @param {Object} options              { temperature, max_tokens, top_p }
 * @returns {Promise<string>}
 */
export const generateNvidiaResponse = async (
  message,
  conversationHistory = [],
  options = {}
) => {
  const messages = [
    ...conversationHistory,
    { role: 'user', content: message },
  ];
  return callLLM(messages, options);
};

/**
 * Generate multiple completions (sequential calls).
 * @param {string} prompt   The prompt
 * @param {number} count    Number of completions
 * @param {Object} options  { temperature, max_tokens }
 * @returns {Promise<string[]>}
 */
export const generateNvidiaCompletions = async (
  prompt,
  count = 1,
  options = {}
) => {
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(await callLLM([{ role: 'user', content: prompt }], options));
  }
  return results;
};

/**
 * Generate structured (JSON) output.
 * @param {string} prompt   The prompt
 * @param {string} format   'json' or 'yaml'
 * @param {Object} options  { temperature, max_tokens }
 * @returns {Promise<Object|string>}
 */
export const generateNvidiaStructured = async (
  prompt,
  format = 'json',
  options = {}
) => {
  const response = await generateNvidiaResponse(
    `${prompt}\n\nPlease respond in ${format.toUpperCase()} format only, with no additional text.`,
    [],
    options
  );

  if (format.toLowerCase() === 'json') {
    return JSON.parse(response);
  }
  return response;
};

const nvidiallm = {
  generateNvidiaResponse,
  generateNvidiaCompletions,
  generateNvidiaStructured,
};

export default nvidiallm;
