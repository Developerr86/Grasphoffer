/**
 * Groq API Service
 * Handles communication with Groq API using OpenAI GPT-OSS-20B model
 */

const Groq = require('groq-sdk');

class GroqService {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.modelName = 'llama3-8b-8192'; // Using Llama 3 8B model on Groq
  }

  /**
   * Initialize Groq client
   */
  initialize() {
    if (this.isInitialized) return;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }

    this.client = new Groq({
      apiKey: apiKey
    });

    this.isInitialized = true;
    console.log('Groq service initialized with model:', this.modelName);
  }

  /**
   * Generate response using Groq API
   * @param {Object} payload - RAG payload
   * @param {string} payload.question - User's question
   * @param {string} payload.context - Relevant context
   * @param {Array} payload.weakConcepts - Array of weak concepts
   * @param {Array} payload.Stats - Learning statistics [difficulties, progress]
   * @returns {Object} Generated response with answer, citations, and themes
   */
  async generateResponse(payload) {
    if (!this.isInitialized) {
      this.initialize();
    }

    try {
      console.log('Generating response with Groq API...');
      
      const { question, context, weakConcepts, Stats } = payload;
      
      // Build the prompt
      const prompt = this.buildPrompt(question, context, weakConcepts, Stats);

      // Log the final prompt for debugging
      console.log('=== FINAL PROMPT BEING SENT TO GROQ LLM ===');
      console.log(prompt);
      console.log('=== END OF PROMPT ===');

      // Call Groq API
      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: this.modelName,
        temperature: 0.1,
        max_tokens: 2048,
        top_p: 1,
        stream: false
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response generated from Groq API');
      }

      // Parse and format the response
      const formattedResponse = this.parseResponse(response, context);

      // Mark this as a RAG response
      formattedResponse.source = 'RAG_SYSTEM';
      formattedResponse.model = this.modelName;

      console.log('=== RAG RESPONSE GENERATED SUCCESSFULLY ===');
      console.log('Source: RAG System with Groq LLM');
      console.log('Model:', this.modelName);
      console.log('Response length:', response.length);
      console.log('=== END OF RAG RESPONSE INFO ===');

      return formattedResponse;

    } catch (error) {
      console.error('Error generating response with Groq:', error);
      throw new Error(`Groq API error: ${error.message}`);
    }
  }

  /**
   * Build the prompt for the RAG system
   * @param {string} question - User's question
   * @param {string} context - Relevant context
   * @param {Array} weakConcepts - Weak concepts
   * @param {Array} Stats - Learning statistics
   * @returns {string} Formatted prompt
   */
  buildPrompt(question, context, weakConcepts, Stats) {
    const [areasOfDifficulty, learningProgress] = Stats;

    return `You are an intelligent learning assistant with access to the user's learning materials and progress data.

**USER'S QUESTION:**
${question}

**RELEVANT LEARNING CONTEXT:**
${context}

**USER'S AREAS OF DIFFICULTY:**
${areasOfDifficulty.length > 0 ? areasOfDifficulty.join(', ') : 'None identified'}

**USER'S LEARNING PROGRESS:**
${learningProgress.length > 0 ? learningProgress.join(', ') : 'No progress data available'}

**WEAK CONCEPTS TO ADDRESS:**
${weakConcepts.length > 0 ? weakConcepts.join(', ') : 'None specified'}

**INSTRUCTIONS:**
1. Answer the user's question based on the provided context
2. Tailor your response to their learning level and areas of difficulty
3. If the user is struggling with related concepts, provide additional clarification
4. Use examples from their learning materials when possible
5. Be encouraging and supportive in your tone
6. If you cannot answer based on the context, clearly state this

**RESPONSE FORMAT:**
Provide a comprehensive answer that:
- Directly addresses the question
- References relevant parts of their learning materials
- Considers their areas of difficulty
- Includes practical examples or applications
- Suggests next steps for learning if appropriate

Please provide your response now:`;
  }

  /**
   * Get system prompt for the AI assistant
   * @returns {string} System prompt
   */
  getSystemPrompt() {
    return `You are an expert educational AI assistant specializing in personalized learning support. Your role is to:

1. Provide accurate, helpful answers based on the user's learning materials
2. Adapt explanations to the user's current understanding level
3. Address areas where the user is struggling with additional support
4. Use encouraging and supportive language
5. Reference specific parts of the user's materials when relevant
6. Suggest practical applications and next learning steps

Always be:
- Clear and concise in explanations
- Patient and encouraging
- Specific and evidence-based
- Focused on the user's learning goals

If you cannot answer a question based on the provided context, clearly state this limitation and suggest how the user might find the information they need.`;
  }

  /**
   * Parse and format the response from Groq
   * @param {string} response - Raw response from Groq
   * @param {string} context - Original context for citation extraction
   * @returns {Object} Formatted response object
   */
  parseResponse(response, context) {
    try {
      // Extract citations from context
      const citations = this.extractCitations(response, context);
      
      // Extract themes from the response and context
      const themes = this.extractThemes(response, context);

      return {
        answer: response.trim(),
        citations: citations,
        themes: themes
      };

    } catch (error) {
      console.error('Error parsing response:', error);
      return {
        answer: response.trim(),
        citations: [],
        themes: ''
      };
    }
  }

  /**
   * Extract citations from the response
   * @param {string} response - Generated response
   * @param {string} context - Original context
   * @returns {Array} Array of citation objects
   */
  extractCitations(response, context) {
    const citations = [];
    
    try {
      // Split context into sections for citation
      const sections = context.split(/(?=##\s)/g).filter(section => section.trim().length > 0);
      
      sections.forEach((section, index) => {
        const title = section.match(/##\s*([^\n]+)/)?.[1] || `Section ${index + 1}`;
        const preview = section.substring(0, 200).replace(/##\s*[^\n]+\n?/, '').trim();
        
        if (preview.length > 20) {
          citations.push({
            title: title,
            content: preview + (section.length > 200 ? '...' : ''),
            section: index + 1
          });
        }
      });

      // Limit to top 3 citations
      return citations.slice(0, 3);

    } catch (error) {
      console.error('Error extracting citations:', error);
      return [];
    }
  }

  /**
   * Extract themes from response and context
   * @param {string} response - Generated response
   * @param {string} context - Original context
   * @returns {string} Comma-separated themes
   */
  extractThemes(response, context) {
    try {
      const themes = new Set();
      const combinedText = (response + ' ' + context).toLowerCase();

      // Common educational themes
      const themePatterns = {
        'Learning and Education': /\b(learning|education|study|knowledge|understanding|concept|theory)\b/g,
        'Problem Solving': /\b(problem|solution|solve|approach|method|strategy)\b/g,
        'Mathematics': /\b(math|equation|formula|calculation|number|algebra|geometry)\b/g,
        'Science': /\b(science|research|experiment|hypothesis|data|analysis)\b/g,
        'Technology': /\b(technology|software|programming|computer|digital|algorithm)\b/g,
        'Communication': /\b(communication|language|writing|speaking|presentation)\b/g,
        'Critical Thinking': /\b(analysis|evaluate|compare|contrast|reasoning|logic)\b/g,
        'Practical Application': /\b(application|practice|example|implementation|real.world)\b/g
      };

      Object.entries(themePatterns).forEach(([theme, pattern]) => {
        const matches = combinedText.match(pattern);
        if (matches && matches.length >= 3) {
          themes.add(theme);
        }
      });

      return Array.from(themes).slice(0, 4).join(', ');

    } catch (error) {
      console.error('Error extracting themes:', error);
      return 'General Learning Content';
    }
  }

  /**
   * Test the Groq API connection
   * @returns {Object} Test result
   */
  async testConnection() {
    try {
      if (!this.isInitialized) {
        this.initialize();
      }

      const testCompletion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: 'Hello, please respond with "Connection successful" to test the API.'
          }
        ],
        model: this.modelName,
        max_tokens: 10,
        temperature: 0
      });

      const response = testCompletion.choices[0]?.message?.content;
      
      return {
        success: true,
        message: 'Groq API connection successful',
        response: response,
        model: this.modelName
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        model: this.modelName
      };
    }
  }
}

// Create singleton instance
const groqService = new GroqService();

module.exports = groqService;
