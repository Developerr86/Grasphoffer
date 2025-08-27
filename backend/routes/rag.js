const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Import RAG services
const ragService = require('../services/ragService');
const contextProcessor = require('../services/contextProcessor');

// In-memory storage for request tracking (in production, use Redis or database)
const requestStore = new Map();

/**
 * Submit a question for processing (TheHopper)
 * POST /api/thehopper/ask
 */
router.post('/thehopper/ask', async (req, res) => {
  try {
    const { question, context, weakConcepts } = req.body;

    if (!question || !context) {
      return res.status(400).json({
        success: false,
        error: 'Question and context are required'
      });
    }

    // Generate unique request ID
    const requestId = uuidv4();

    // Store request for tracking
    requestStore.set(requestId, {
      status: 'processing',
      question,
      context,
      weakConcepts: weakConcepts || [],
      createdAt: new Date(),
      service: 'thehopper'
    });

    // Start async processing
    processRAGRequest(requestId, question, context, weakConcepts || [], 'thehopper');

    res.json({
      success: true,
      requestId,
      message: 'Question submitted for processing'
    });

  } catch (error) {
    console.error('Error submitting TheHopper question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit question'
    });
  }
});

/**
 * Get request status
 * GET /api/:service/status/:requestId
 */
router.get('/:service/status/:requestId', (req, res) => {
  try {
    const { requestId, service } = req.params;
    const request = requestStore.get(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    if (request.service !== service) {
      return res.status(400).json({
        success: false,
        error: 'Service mismatch'
      });
    }

    res.json({
      success: true,
      status: request.status,
      progress: request.progress || 0,
      message: request.message || ''
    });

  } catch (error) {
    console.error('Error getting request status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get request status'
    });
  }
});

/**
 * Get request result
 * GET /api/:service/result/:requestId
 */
router.get('/:service/result/:requestId', (req, res) => {
  try {
    const { requestId, service } = req.params;
    const request = requestStore.get(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    if (request.service !== service) {
      return res.status(400).json({
        success: false,
        error: 'Service mismatch'
      });
    }

    if (request.status !== 'completed') {
      return res.status(202).json({
        success: false,
        error: 'Request not completed yet',
        status: request.status
      });
    }

    res.json({
      success: true,
      answer: request.result.answer,
      citations: request.result.citations || [],
      themes: request.result.themes || '',
      processingTime: request.result.processingTime
    });

  } catch (error) {
    console.error('Error getting request result:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get request result'
    });
  }
});

/**
 * Test RAG pipeline
 * GET /api/test
 */
router.get('/test', async (req, res) => {
  try {
    const testResult = await ragService.testPipeline();
    res.json(testResult);
  } catch (error) {
    console.error('Error testing RAG pipeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test RAG pipeline'
    });
  }
});

/**
 * Get service status
 * GET /api/status
 */
router.get('/status', async (req, res) => {
  try {
    const status = await ragService.getStatus();
    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error('Error getting service status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get service status'
    });
  }
});

/**
 * Async function to process RAG requests
 */
async function processRAGRequest(requestId, question, context, weakConcepts, service) {
  try {
    const request = requestStore.get(requestId);
    if (!request) return;

    const startTime = Date.now();

    // Update status
    request.status = 'processing';
    request.progress = 10;
    request.message = 'Processing context...';

    // Process the context and extract stats
    const processedData = await contextProcessor.processContext(context, weakConcepts);

    request.progress = 30;
    request.message = 'Generating embeddings...';

    // Generate response using RAG
    const result = await ragService.generateResponse({
      question,
      context: processedData.context,
      weakConcepts: processedData.weakConcepts,
      Stats: processedData.Stats
    });

    request.progress = 100;
    request.status = 'completed';
    request.message = 'Processing complete';
    request.result = {
      ...result,
      processingTime: Date.now() - startTime
    };

    // Clean up old requests (keep for 1 hour)
    setTimeout(() => {
      requestStore.delete(requestId);
    }, 60 * 60 * 1000);

  } catch (error) {
    console.error(`Error processing RAG request ${requestId}:`, error);
    const request = requestStore.get(requestId);
    if (request) {
      request.status = 'error';
      request.error = error.message;
      request.message = 'Processing failed';
    }
  }
}

module.exports = router;
