/**
 * RAG Service
 * Main service that coordinates the RAG pipeline
 */

const embeddingService = require('./embeddingService');
const groqService = require('./groqService');
const contextProcessor = require('./contextProcessor');

class RAGService {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Initialize the RAG service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('Initializing RAG service...');
      
      // Initialize embedding service
      await embeddingService.initialize();
      
      // Initialize Groq service
      groqService.initialize();
      
      this.isInitialized = true;
      console.log('RAG service initialized successfully');
      
    } catch (error) {
      console.error('Error initializing RAG service:', error);
      throw new Error('Failed to initialize RAG service');
    }
  }

  /**
   * Generate response using the complete RAG pipeline
   * @param {Object} payload - RAG payload with new structure
   * @param {string} payload.question - User's question
   * @param {string} payload.context - Full context from user documents and flashcards
   * @param {Array} payload.weakConcepts - Array of weak concepts
   * @param {Array} payload.Stats - [areasOfDifficulty, learningProgress]
   * @returns {Object} Generated response
   */
  async generateResponse(payload) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('Starting RAG pipeline...');
      const startTime = Date.now();

      const { question, context, weakConcepts, Stats } = payload;

      // Step 1: Get most relevant context using semantic similarity
      console.log('Step 1: Finding relevant context...');
      const relevantContext = await embeddingService.getRelevantContext(
        context, 
        question, 
        4 // Top 4 results as requested
      );

      // Step 2: Create the final payload for Groq
      const groqPayload = {
        question,
        context: relevantContext,
        weakConcepts,
        Stats
      };

      console.log('=== RAG PIPELINE PAYLOAD ===');
      console.log('Question:', question);
      console.log('Context length:', relevantContext.length, 'characters');
      console.log('Weak concepts:', weakConcepts);
      console.log('Stats arrays:', Stats.map(arr => `[${arr.length} items]`));
      console.log('=== END OF PAYLOAD ===');

      console.log('Step 2: Generating response with Groq...');
      
      // Step 3: Generate response using Groq API
      const response = await groqService.generateResponse(groqPayload);

      const processingTime = Date.now() - startTime;

      console.log('=== RAG PIPELINE COMPLETED ===');
      console.log(`Processing time: ${processingTime}ms`);
      console.log(`Context reduction: ${context.length} → ${relevantContext.length} characters`);
      console.log(`Response source: ${response.source || 'RAG_SYSTEM'}`);
      console.log(`Model used: ${response.model || 'Unknown'}`);
      console.log('=== END OF RAG PIPELINE ===');

      return {
        ...response,
        processingTime,
        contextLength: relevantContext.length,
        originalContextLength: context.length,
        relevantSections: 4
      };

    } catch (error) {
      console.error('Error in RAG pipeline:', error);
      throw new Error(`RAG pipeline failed: ${error.message}`);
    }
  }

  /**
   * Process raw context and prepare it for RAG
   * @param {string} rawContext - Raw context from user documents
   * @param {Array} weakConcepts - Weak concepts array
   * @returns {Object} Processed context with stats
   */
  async processContext(rawContext, weakConcepts = []) {
    try {
      console.log('Processing raw context for RAG...');
      
      // Use context processor to extract stats and format data
      const processedData = await contextProcessor.processContext(rawContext, weakConcepts);
      
      return processedData;

    } catch (error) {
      console.error('Error processing context:', error);
      throw new Error('Failed to process context');
    }
  }

  /**
   * Test the complete RAG pipeline
   * @param {string} testQuestion - Test question
   * @param {string} testContext - Test context
   * @returns {Object} Test result
   */
  async testPipeline(testQuestion = "What is machine learning?", testContext = "Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed.") {
    try {
      console.log('Testing RAG pipeline...');

      const testPayload = {
        question: testQuestion,
        context: testContext,
        weakConcepts: ["algorithms", "data processing"],
        Stats: [
          ["Understanding algorithms", "Data preprocessing"],
          ["Completed basic ML course", "70% accuracy on practice tests"]
        ]
      };

      const result = await this.generateResponse(testPayload);
      
      return {
        success: true,
        message: 'RAG pipeline test successful',
        result: result,
        testPayload: testPayload
      };

    } catch (error) {
      console.error('RAG pipeline test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get service status
   * @returns {Object} Service status
   */
  async getStatus() {
    try {
      const embeddingStatus = embeddingService.isInitialized;
      const groqStatus = groqService.isInitialized;
      
      // Test Groq connection
      const groqTest = await groqService.testConnection();

      return {
        ragService: this.isInitialized,
        embeddingService: embeddingStatus,
        groqService: groqStatus,
        groqConnection: groqTest.success,
        groqModel: groqTest.model,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error getting service status:', error);
      return {
        ragService: this.isInitialized,
        embeddingService: false,
        groqService: false,
        groqConnection: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate payload structure
   * @param {Object} payload - Payload to validate
   * @returns {Object} Validation result
   */
  validatePayload(payload) {
    const errors = [];

    if (!payload) {
      errors.push('Payload is required');
      return { valid: false, errors };
    }

    if (!payload.question || typeof payload.question !== 'string') {
      errors.push('Question is required and must be a string');
    }

    if (!payload.context || typeof payload.context !== 'string') {
      errors.push('Context is required and must be a string');
    }

    if (payload.weakConcepts && !Array.isArray(payload.weakConcepts)) {
      errors.push('WeakConcepts must be an array');
    }

    if (payload.Stats) {
      if (!Array.isArray(payload.Stats)) {
        errors.push('Stats must be an array');
      } else if (payload.Stats.length !== 2) {
        errors.push('Stats must contain exactly 2 arrays [areasOfDifficulty, learningProgress]');
      } else {
        if (!Array.isArray(payload.Stats[0])) {
          errors.push('Stats[0] (areasOfDifficulty) must be an array');
        }
        if (!Array.isArray(payload.Stats[1])) {
          errors.push('Stats[1] (learningProgress) must be an array');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    try {
      console.log('Cleaning up RAG service...');
      // Add any cleanup logic here if needed
      this.isInitialized = false;
      console.log('RAG service cleanup completed');
    } catch (error) {
      console.error('Error during RAG service cleanup:', error);
    }
  }
}

// Create singleton instance
const ragService = new RAGService();

module.exports = ragService;
