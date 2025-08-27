// Simple test file for learning framework utility functions
// We'll focus on testing the non-AI utility functions that don't require mocking

const {
  calculateEvaluationResults,
  getFailedConcepts,
  isEvaluationComplete
} = require('./learningFramework');

describe('Learning Framework', () => {
  
  describe('Utility Functions', () => {
    test('calculateEvaluationResults should correctly calculate results', () => {
      const answers = {
        '0-0': { isCorrect: true, concept: 'Concept 1' },
        '0-1': { isCorrect: true, concept: 'Concept 1' },
        '0-2': { isCorrect: false, concept: 'Concept 1' },
        '0-3': { isCorrect: true, concept: 'Concept 1' },
        '0-4': { isCorrect: true, concept: 'Concept 1' },
        '1-0': { isCorrect: true, concept: 'Concept 2' },
        '1-1': { isCorrect: false, concept: 'Concept 2' },
        '1-2': { isCorrect: false, concept: 'Concept 2' },
        '1-3': { isCorrect: true, concept: 'Concept 2' },
        '1-4': { isCorrect: false, concept: 'Concept 2' }
      };
      const concepts = ['Concept 1', 'Concept 2'];
      
      const results = calculateEvaluationResults(answers, concepts, 4);
      
      expect(results['Concept 1']).toEqual({
        correct: 4,
        total: 5,
        passed: true,
        questions: expect.any(Array)
      });
      
      expect(results['Concept 2']).toEqual({
        correct: 2,
        total: 5,
        passed: false,
        questions: expect.any(Array)
      });
    });

    test('getFailedConcepts should return only failed concepts', () => {
      const results = {
        'Concept 1': { passed: true },
        'Concept 2': { passed: false },
        'Concept 3': { passed: true },
        'Concept 4': { passed: false }
      };
      const concepts = ['Concept 1', 'Concept 2', 'Concept 3', 'Concept 4'];
      
      const failed = getFailedConcepts(results, concepts);
      
      expect(failed).toEqual(['Concept 2', 'Concept 4']);
    });

    test('isEvaluationComplete should return true when all concepts passed', () => {
      const results = {
        'Concept 1': { passed: true },
        'Concept 2': { passed: true },
        'Concept 3': { passed: true }
      };
      const concepts = ['Concept 1', 'Concept 2', 'Concept 3'];
      
      const isComplete = isEvaluationComplete(results, concepts);
      
      expect(isComplete).toBe(true);
    });

    test('isEvaluationComplete should return false when some concepts failed', () => {
      const results = {
        'Concept 1': { passed: true },
        'Concept 2': { passed: false },
        'Concept 3': { passed: true }
      };
      const concepts = ['Concept 1', 'Concept 2', 'Concept 3'];
      
      const isComplete = isEvaluationComplete(results, concepts);
      
      expect(isComplete).toBe(false);
    });
  });

  describe('AI-Powered Functions', () => {
    test('generateAdvancedConceptsList should return advanced concepts', async () => {
      const topic = 'Machine Learning';
      
      const concepts = await generateAdvancedConceptsList(topic);
      
      expect(concepts).toHaveLength(5);
      expect(Array.isArray(concepts)).toBe(true);
      expect(concepts[0]).toBe('Advanced Concept 1');
    });

    test('generateSessionReport should return comprehensive report', async () => {
      const topic = 'Machine Learning';
      const prerequisiteResults = {
        'Linear Algebra': { passed: true, correct: 4, total: 5 },
        'Statistics': { passed: true, correct: 5, total: 5 }
      };
      const coreResults = {
        'Supervised Learning': { passed: true, correct: 4, total: 5 },
        'Neural Networks': { passed: false, correct: 3, total: 5 }
      };
      const advancedResults = {
        'Deep Learning': { passed: true, correct: 4, total: 5 }
      };

      // Mock the AI response for session report
      const mockAiResponse = JSON.stringify({
        overallSummary: "Great performance overall!",
        strengths: ["Strong foundation", "Good problem solving"],
        areasForImprovement: ["Neural Networks concepts"],
        recommendations: ["Practice more", "Review materials"],
        motivationalMessage: "Keep up the great work!"
      });

      // Update the mock to return session report response
      require('@google/generative-ai').GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockResolvedValue({
            response: {
              text: jest.fn().mockReturnValue(mockAiResponse)
            }
          })
        })
      }));
      
      const report = await generateSessionReport(
        topic,
        prerequisiteResults,
        coreResults,
        advancedResults,
        Object.keys(prerequisiteResults),
        Object.keys(coreResults),
        Object.keys(advancedResults)
      );
      
      expect(report).toHaveProperty('overallSummary');
      expect(report).toHaveProperty('strengths');
      expect(report).toHaveProperty('areasForImprovement');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('motivationalMessage');
      expect(report).toHaveProperty('statistics');
      
      expect(report.statistics).toHaveProperty('prerequisites');
      expect(report.statistics).toHaveProperty('coreTopics');
      expect(report.statistics).toHaveProperty('advancedTopics');
      expect(report.statistics).toHaveProperty('overall');
    });
  });

  describe('Error Handling', () => {
    test('generateAdvancedConceptsList should handle API errors gracefully', async () => {
      // Mock API failure
      require('@google/generative-ai').GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockRejectedValue(new Error('API Error'))
        })
      }));

      const topic = 'Machine Learning';
      const concepts = await generateAdvancedConceptsList(topic);
      
      // Should return fallback concepts
      expect(concepts).toHaveLength(5);
      expect(concepts[0]).toContain('Advanced Techniques in Machine Learning');
    });
  });
});
