import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

/**
 * Learning Framework - Reusable functions for concept-based learning
 * This framework provides methods for generating concepts, conducting evaluations,
 * and managing learning phases for any type of educational content.
 */

/**
 * Generate core concepts for a given main topic
 * @param {string} topic - The main topic to generate core concepts for
 * @param {number} count - Number of concepts to generate (default: 5)
 * @returns {Promise<Array<string>>} Array of core concept names
 */
export const generateCoreConceptsList = async (topic, count = 5) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an educational AI assistant. Given a main learning topic, provide a comprehensive list of core concepts that are essential for mastering this topic.

Main Topic: "${topic}"

Please provide exactly ${count} core concepts that are essential for understanding "${topic}". Each concept should be:
1. A fundamental component or principle of the main topic
2. Essential for comprehensive understanding of the topic
3. Specific and focused (not too broad)
4. Logically structured for learning progression
5. Directly related to the main topic (not peripheral knowledge)

Format your response as a JSON array of strings, like this:
["Core Concept 1", "Core Concept 2", "Core Concept 3", "Core Concept 4", "Core Concept 5"]

Only return the JSON array, no additional text or explanation.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      const concepts = JSON.parse(cleanText.trim());
      return concepts;
    } catch (parseError) {
      console.error('Failed to parse core concepts JSON:', parseError);
      // Fallback to a default set if parsing fails
      return [
        `Fundamental Principles of ${topic}`,
        `Key Components in ${topic}`,
        `Core Methods in ${topic}`,
        `Essential Applications of ${topic}`,
        `Advanced Concepts in ${topic}`
      ];
    }
  } catch (error) {
    console.error('Error generating core concepts:', error);
    // Return fallback concepts
    return [
      `Fundamental Principles of ${topic}`,
      `Key Components in ${topic}`,
      `Core Methods in ${topic}`,
      `Essential Applications of ${topic}`,
      `Advanced Concepts in ${topic}`
    ];
  }
};

/**
 * Generate MCQ questions for concept evaluation
 * @param {string} concept - The concept to generate questions for
 * @param {number} questionCount - Number of questions to generate (default: 5)
 * @returns {Promise<Array<Object>>} Array of MCQ question objects
 */
export const generateConceptMCQQuestions = async (concept, questionCount = 5) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an educational AI assistant. Generate exactly ${questionCount} multiple-choice questions for the concept: "${concept}"

Each question should:
1. Test fundamental understanding of the concept
2. Have exactly 4 options (A, B, C, D)
3. Have only one correct answer
4. Be at an appropriate difficulty level for someone learning this concept
5. Cover different aspects of the concept
6. Be clear and unambiguous

Format your response as a JSON array with this exact structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option B"
  },
  // ... ${questionCount - 1} more questions
]

Only return the JSON array, no additional text or explanation.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      const questions = JSON.parse(cleanText.trim());
      return questions;
    } catch (parseError) {
      console.error('Failed to parse MCQ questions JSON:', parseError);
      // Fallback questions
      return Array.from({ length: questionCount }, (_, index) => ({
        question: `What is a key aspect of ${concept}? (Question ${index + 1})`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: ["Option A", "Option B", "Option C", "Option D"][index % 4]
      }));
    }
  } catch (error) {
    console.error('Error generating MCQ questions:', error);
    // Return fallback questions
    return Array.from({ length: questionCount }, (_, index) => ({
      question: `What is a key aspect of ${concept}? (Question ${index + 1})`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: ["Option A", "Option B", "Option C", "Option D"][index % 4]
    }));
  }
};

/**
 * Generate an evaluation report based on results
 * @param {Object} results - Evaluation results keyed by concept name
 * @param {Array<string>} concepts - Array of concept names
 * @param {string} contextType - Type of evaluation ("prerequisite" or "core")
 * @returns {Promise<Object>} Report object with remark and recommendations
 */
export const generateConceptEvaluationReport = async (results, concepts, contextType = "core") => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Create a summary of results for the AI
    const resultsSummary = concepts.map(concept => {
      const result = results[concept];
      return `${concept}: ${result.correct}/${result.total} (${result.passed ? 'PASSED' : 'FAILED'})`;
    }).join('\n');

    const totalConcepts = concepts.length;
    const passedConcepts = concepts.filter(concept => results[concept].passed).length;
    const failedConcepts = totalConcepts - passedConcepts;

    const prompt = `
You are an educational AI assistant. Based on the following ${contextType} concept evaluation results, provide a personalized report with a general remark and recommendations.

Evaluation Results:
${resultsSummary}

Summary:
- Total ${contextType} concepts evaluated: ${totalConcepts}
- Concepts passed: ${passedConcepts}
- Concepts failed: ${failedConcepts}
- Passing criteria: 4/5 questions correct per concept

Context: This is a ${contextType} concepts evaluation. ${contextType === 'core' ? 
  'These are the main concepts the student needs to master for the topic.' : 
  'These are foundational concepts needed before learning the main topic.'}

Please provide:
1. A general remark about the student's performance (2-3 sentences)
2. Specific recommendations for improvement (if any failures) or next steps (if all passed)

Format your response as JSON:
{
  "remark": "Your general remark here...",
  "recommendations": ["Recommendation 1", "Recommendation 2", ...]
}

Only return the JSON, no additional text.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      const report = JSON.parse(cleanText.trim());
      return report;
    } catch (parseError) {
      console.error('Failed to parse evaluation report JSON:', parseError);
      // Fallback report
      return {
        remark: `You completed the ${contextType} concepts evaluation with ${passedConcepts} out of ${totalConcepts} concepts passed. ${failedConcepts > 0 ? `Focus on the failed ${contextType} concepts to strengthen your understanding.` : `Great job on passing all ${contextType} concepts!`}`,
        recommendations: failedConcepts > 0 
          ? [`Review the ${contextType} concepts you didn't pass`, `Practice more questions on weak ${contextType} areas`, `Seek additional resources for difficult ${contextType} concepts`]
          : [`Continue to the next learning phase`, `You have a solid foundation in the ${contextType} concepts`]
      };
    }
  } catch (error) {
    console.error('Error generating evaluation report:', error);
    // Return fallback report
    const passedConcepts = concepts.filter(concept => results[concept].passed).length;
    const totalConcepts = concepts.length;
    const failedConcepts = totalConcepts - passedConcepts;
    
    return {
      remark: `You completed the ${contextType} concepts evaluation with ${passedConcepts} out of ${totalConcepts} concepts passed. ${failedConcepts > 0 ? `Focus on the failed ${contextType} concepts to strengthen your understanding.` : `Great job on passing all ${contextType} concepts!`}`,
      recommendations: failedConcepts > 0 
        ? [`Review the ${contextType} concepts you didn't pass`, `Practice more questions on weak ${contextType} areas`, `Seek additional resources for difficult ${contextType} concepts`]
        : [`Continue to the next learning phase`, `You have a solid foundation in the ${contextType} concepts`]
    };
  }
};

/**
 * Generate subtopics for a given concept
 * @param {string} concept - The concept to break down into subtopics
 * @param {number} count - Number of subtopics to generate (default: 4-6)
 * @returns {Promise<Array<string>>} Array of subtopic names
 */
export const generateConceptSubtopics = async (concept, count = 5) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an educational AI assistant. For the concept "${concept}", generate a list of ${count-1}-${count+1} key subtopics that need to be covered for a comprehensive understanding.

Each subtopic should be:
1. A specific aspect or component of the main concept
2. Logically sequenced for learning
3. Essential for understanding the overall concept
4. Concise and clear
5. Building upon each other progressively

Format your response as a JSON array of strings:
["Subtopic 1", "Subtopic 2", "Subtopic 3", "Subtopic 4", "Subtopic 5"]

Only return the JSON array, no additional text.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      const subtopics = JSON.parse(cleanText.trim());
      return subtopics;
    } catch (parseError) {
      console.error('Failed to parse subtopics JSON:', parseError);
      // Fallback subtopics
      return [
        `Introduction to ${concept}`,
        `Key Principles of ${concept}`,
        `Applications of ${concept}`,
        `Advanced ${concept} Topics`
      ];
    }
  } catch (error) {
    console.error('Error generating subtopics:', error);
    // Return fallback subtopics
    return [
      `Introduction to ${concept}`,
      `Key Principles of ${concept}`,
      `Applications of ${concept}`,
      `Advanced ${concept} Topics`
    ];
  }
};

/**
 * Generate educational content for a subtopic
 * @param {string} subtopic - The subtopic to generate content for
 * @param {string} parentConcept - The parent concept this subtopic belongs to
 * @param {number} wordCount - Target word count (default: 300)
 * @returns {Promise<string>} Generated educational content
 */
export const generateConceptSubtopicContent = async (subtopic, parentConcept = '', wordCount = 300) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const contextText = parentConcept ? ` (part of the broader concept: "${parentConcept}")` : '';

    const prompt = `
You are an educational AI assistant. Generate educational content for the subtopic: "${subtopic}"${contextText}

The content should be:
1. Approximately ${wordCount} words
2. Clear and easy to understand
3. Educational and informative
4. Well-structured with good flow
5. Engaging for learners
6. Include practical examples where helpful
7. Build upon foundational knowledge progressively

Provide comprehensive coverage of the subtopic while keeping it accessible. Use examples, analogies, and clear explanations to help learners understand the concept.

Return only the content text in markdown format, no additional formatting or explanations.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text.trim();
  } catch (error) {
    console.error('Error generating subtopic content:', error);
    // Return fallback content
    return `# ${subtopic}

This section covers ${subtopic}${parentConcept ? ` as part of ${parentConcept}` : ''}. This is an important concept that forms a fundamental part of understanding the broader topic. 

## Key Points

The key principles and applications will be explained to help you build a solid foundation in this area. Understanding this concept is essential for progressing to more advanced topics.

## Practical Applications

This concept has real-world applications that demonstrate its importance and relevance in the field. By mastering this subtopic, you'll be better equipped to tackle more complex problems and understand advanced materials.

## Summary

${subtopic} is a crucial building block in your learning journey. Take time to understand the fundamental principles before moving on to the next topic.`;
  }
};

/**
 * Utility function to calculate evaluation results
 * @param {Object} answers - User answers keyed by question identifier
 * @param {Array<string>} concepts - Array of concept names
 * @param {number} passingScore - Minimum score to pass (default: 4 out of 5)
 * @returns {Object} Results object keyed by concept name
 */
export const calculateEvaluationResults = (answers, concepts, passingScore = 4) => {
  const results = {};
  
  concepts.forEach((concept, conceptIndex) => {
    const conceptAnswers = Object.keys(answers)
      .filter(key => key.startsWith(`${conceptIndex}-`))
      .map(key => answers[key]);
    
    const correctAnswers = conceptAnswers.filter(answer => answer.isCorrect).length;
    const totalQuestions = conceptAnswers.length;
    const passed = correctAnswers >= passingScore;
    
    results[concept] = {
      correct: correctAnswers,
      total: totalQuestions,
      passed,
      questions: conceptAnswers
    };
  });
  
  return results;
};

/**
 * Utility function to filter failed concepts for learning
 * @param {Object} results - Evaluation results
 * @param {Array<string>} concepts - Array of concept names
 * @returns {Array<string>} Array of failed concept names
 */
export const getFailedConcepts = (results, concepts) => {
  return concepts.filter(concept => !results[concept]?.passed);
};

/**
 * Utility function to check if evaluation is complete
 * @param {Object} results - Evaluation results
 * @param {Array<string>} concepts - Array of concept names
 * @returns {boolean} True if all concepts passed
 */
export const isEvaluationComplete = (results, concepts) => {
  return concepts.every(concept => results[concept]?.passed);
};

/**
 * Generate advanced concepts for a given main topic
 * @param {string} topic - The main topic to generate advanced concepts for
 * @param {number} count - Number of advanced concepts to generate (default: 5)
 * @returns {Promise<Array<string>>} Array of advanced concept names
 */
export const generateAdvancedConceptsList = async (topic, count = 5) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an educational AI assistant. Given a main learning topic, provide a comprehensive list of advanced and niche/domain-specific concepts that build upon the fundamental understanding of this topic.

Main Topic: "${topic}"

Please provide exactly ${count} advanced concepts related to "${topic}". Each concept should be:
1. An advanced or specialized aspect of the main topic
2. Suitable for learners who have mastered the core concepts
3. Domain-specific or representing cutting-edge developments
4. Challenging but achievable for dedicated learners
5. Directly extending or building upon the main topic
6. Representative of real-world professional applications

Format your response as a JSON array of strings, like this:
["Advanced Concept 1", "Advanced Concept 2", "Advanced Concept 3", "Advanced Concept 4", "Advanced Concept 5"]

Only return the JSON array, no additional text or explanation.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      const concepts = JSON.parse(cleanText.trim());
      return concepts;
    } catch (parseError) {
      console.error('Failed to parse advanced concepts JSON:', parseError);
      // Fallback to a default set if parsing fails
      return [
        `Advanced Techniques in ${topic}`,
        `Professional Applications of ${topic}`,
        `Cutting-edge ${topic} Research`,
        `Industry-specific ${topic} Solutions`,
        `Expert-level ${topic} Strategies`
      ];
    }
  } catch (error) {
    console.error('Error generating advanced concepts:', error);
    // Return fallback concepts
    return [
      `Advanced Techniques in ${topic}`,
      `Professional Applications of ${topic}`,
      `Cutting-edge ${topic} Research`,
      `Industry-specific ${topic} Solutions`,
      `Expert-level ${topic} Strategies`
    ];
  }
};

/**
 * Generate an overall session performance report
 * @param {string} topic - The main topic that was learned
 * @param {Object} prerequisiteResults - Results from prerequisite evaluation
 * @param {Object} coreResults - Results from core concepts evaluation
 * @param {Object} advancedResults - Results from advanced concepts evaluation
 * @param {Array<string>} prerequisiteTopics - Array of prerequisite topic names
 * @param {Array<string>} coreTopics - Array of core concept names
 * @param {Array<string>} advancedTopics - Array of advanced concept names
 * @returns {Promise<Object>} Comprehensive session report
 */
export const generateSessionReport = async (
  topic, 
  prerequisiteResults = {}, 
  coreResults = {}, 
  advancedResults = {},
  prerequisiteTopics = [],
  coreTopics = [],
  advancedTopics = []
) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Calculate summary statistics
    const calculateStats = (results, topics) => {
      const totalTopics = topics.length;
      const completedTopics = topics.filter(topic => results[topic]?.passed || false).length;
      const totalQuestions = topics.reduce((sum, topic) => sum + (results[topic]?.total || 0), 0);
      const correctAnswers = topics.reduce((sum, topic) => sum + (results[topic]?.correct || 0), 0);
      return { totalTopics, completedTopics, totalQuestions, correctAnswers };
    };

    const prereqStats = calculateStats(prerequisiteResults, prerequisiteTopics);
    const coreStats = calculateStats(coreResults, coreTopics);
    const advancedStats = calculateStats(advancedResults, advancedTopics);

    const overallStats = {
      totalTopics: prereqStats.totalTopics + coreStats.totalTopics + advancedStats.totalTopics,
      completedTopics: prereqStats.completedTopics + coreStats.completedTopics + advancedStats.completedTopics,
      totalQuestions: prereqStats.totalQuestions + coreStats.totalQuestions + advancedStats.totalQuestions,
      correctAnswers: prereqStats.correctAnswers + coreStats.correctAnswers + advancedStats.correctAnswers
    };

    const overallAccuracy = overallStats.totalQuestions > 0 
      ? Math.round((overallStats.correctAnswers / overallStats.totalQuestions) * 100) 
      : 0;

    // Create detailed summary for AI
    const resultsSummary = `
Learning Topic: "${topic}"

PREREQUISITE PHASE:
- Topics: ${prereqStats.totalTopics}
- Completed: ${prereqStats.completedTopics}
- Questions: ${prereqStats.correctAnswers}/${prereqStats.totalQuestions}

CORE CONCEPTS PHASE:
- Topics: ${coreStats.totalTopics}
- Completed: ${coreStats.completedTopics}
- Questions: ${coreStats.correctAnswers}/${coreStats.totalQuestions}

ADVANCED CONCEPTS PHASE:
- Topics: ${advancedStats.totalTopics}
- Completed: ${advancedStats.completedTopics}
- Questions: ${advancedStats.correctAnswers}/${advancedStats.totalQuestions}

OVERALL PERFORMANCE:
- Total Topics: ${overallStats.completedTopics}/${overallStats.totalTopics}
- Total Questions: ${overallStats.correctAnswers}/${overallStats.totalQuestions}
- Overall Accuracy: ${overallAccuracy}%
`;

    const prompt = `
You are an educational AI assistant. Based on the comprehensive learning session results below, provide a detailed performance report for the student who just completed learning "${topic}".

${resultsSummary}

Please provide:
1. An overall performance summary (3-4 sentences highlighting key achievements)
2. Strengths demonstrated during the learning journey
3. Areas for improvement (if any)
4. Specific recommendations for further learning or skill development
5. A motivational closing remark

The student has completed a full learning journey from prerequisites through core concepts to advanced topics. Provide constructive and encouraging feedback.

Format your response as JSON:
{
  "overallSummary": "Your comprehensive performance summary here...",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "areasForImprovement": ["Area 1", "Area 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "motivationalMessage": "Your encouraging closing message here..."
}

Only return the JSON, no additional text.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      const report = JSON.parse(cleanText.trim());
      
      // Add statistical data to the report
      return {
        ...report,
        statistics: {
          prerequisites: prereqStats,
          coreTopics: coreStats,
          advancedTopics: advancedStats,
          overall: {
            ...overallStats,
            accuracy: overallAccuracy
          }
        }
      };
    } catch (parseError) {
      console.error('Failed to parse session report JSON:', parseError);
      // Fallback report
      return {
        overallSummary: `You have successfully completed your learning journey on "${topic}"! You worked through ${overallStats.completedTopics} out of ${overallStats.totalTopics} topics and achieved ${overallAccuracy}% accuracy overall. This demonstrates solid progress in mastering the subject matter.`,
        strengths: [
          "Completed the full learning pathway from prerequisites to advanced concepts",
          "Demonstrated commitment to comprehensive understanding",
          "Successfully engaged with challenging material"
        ],
        areasForImprovement: overallAccuracy < 80 
          ? ["Consider reviewing topics with lower scores", "Practice more questions on challenging concepts"]
          : ["Continue building on your strong foundation"],
        recommendations: [
          "Apply your knowledge through practical projects",
          "Explore real-world applications of the concepts learned",
          "Consider teaching others to reinforce your understanding"
        ],
        motivationalMessage: "Congratulations on completing this comprehensive learning journey! Your dedication to understanding both fundamental and advanced concepts shows great commitment to mastery. Keep building on this solid foundation!",
        statistics: {
          prerequisites: prereqStats,
          coreTopics: coreStats,
          advancedTopics: advancedStats,
          overall: {
            ...overallStats,
            accuracy: overallAccuracy
          }
        }
      };
    }
  } catch (error) {
    console.error('Error generating session report:', error);
    // Return fallback report with basic statistics
    return {
      overallSummary: `You have successfully completed your learning journey on "${topic}"! You worked through ${prereqStats.completedTopics + coreStats.completedTopics + advancedStats.completedTopics} out of ${prereqStats.totalTopics + coreStats.totalTopics + advancedStats.totalTopics} topics and achieved an overall accuracy.`,
      strengths: [
        "Completed the full learning pathway from prerequisites to advanced concepts",
        "Demonstrated commitment to comprehensive understanding",
        "Successfully engaged with challenging material"
      ],
      areasForImprovement: ["Focus on areas with lower scores", "Continue practice on challenging questions"],
      recommendations: [
        "Strengthen understanding through more practice",
        "Consider study groups or pair learning",
        "Engage in projects that apply learned skills"
      ],
      motivationalMessage: "Congratulations on completing this challenging learning path! Keep pushing forward and applying your new skills.",
      statistics: {
        prerequisites: prereqStats,
        coreTopics: coreStats,
        advancedTopics: advancedStats
      }
    };
  }
};
