import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

export const generatePrerequisites = async (topic) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an educational AI assistant. Given a learning topic, provide a comprehensive list of prerequisite knowledge areas that a student should be familiar with before learning the main topic.

Topic: "${topic}"

Please provide exactly 5 prerequisite topics that are essential for understanding "${topic}". Each prerequisite should be:
1. A fundamental concept or skill needed
2. Specific and focused (not too broad)
3. Logically building toward the main topic

Format your response as a JSON array of strings, like this:
["Prerequisite 1", "Prerequisite 2", "Prerequisite 3", "Prerequisite 4", "Prerequisite 5"]

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
      
      const prerequisites = JSON.parse(cleanText.trim());
      return prerequisites;
    } catch (parseError) {
      console.error('Failed to parse prerequisites JSON:', parseError);
      // Fallback to a default set if parsing fails
      return [
        'Basic Mathematics',
        'Logical Thinking',
        'Problem Solving',
        'Computer Basics',
        'Analytical Skills'
      ];
    }
  } catch (error) {
    console.error('Error generating prerequisites:', error);
    // Return fallback prerequisites
    return [
      'Basic Mathematics',
      'Logical Thinking', 
      'Problem Solving',
      'Computer Basics',
      'Analytical Skills'
    ];
  }
};

export const generateMCQQuestions = async (topic) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an educational AI assistant. Generate exactly 5 multiple-choice questions for the topic: "${topic}"

Each question should:
1. Test fundamental understanding of the topic
2. Have exactly 4 options (A, B, C, D)
3. Have only one correct answer
4. Be at an appropriate difficulty level for someone learning this topic
5. Cover different aspects of the topic

Format your response as a JSON array with this exact structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option B"
  },
  // ... 4 more questions
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
      return [
        {
          question: `What is a key concept in ${topic}?`,
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: "Option A"
        },
        {
          question: `Which statement best describes ${topic}?`,
          options: ["Statement A", "Statement B", "Statement C", "Statement D"],
          correctAnswer: "Statement B"
        },
        {
          question: `What is the primary purpose of ${topic}?`,
          options: ["Purpose A", "Purpose B", "Purpose C", "Purpose D"],
          correctAnswer: "Purpose C"
        },
        {
          question: `How does ${topic} relate to other concepts?`,
          options: ["Relation A", "Relation B", "Relation C", "Relation D"],
          correctAnswer: "Relation D"
        },
        {
          question: `What is an important application of ${topic}?`,
          options: ["Application A", "Application B", "Application C", "Application D"],
          correctAnswer: "Application A"
        }
      ];
    }
  } catch (error) {
    console.error('Error generating MCQ questions:', error);
    // Return fallback questions
    return [
      {
        question: `What is a key concept in ${topic}?`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Option A"
      },
      {
        question: `Which statement best describes ${topic}?`,
        options: ["Statement A", "Statement B", "Statement C", "Statement D"],
        correctAnswer: "Statement B"
      },
      {
        question: `What is the primary purpose of ${topic}?`,
        options: ["Purpose A", "Purpose B", "Purpose C", "Purpose D"],
        correctAnswer: "Purpose C"
      },
      {
        question: `How does ${topic} relate to other concepts?`,
        options: ["Relation A", "Relation B", "Relation C", "Relation D"],
        correctAnswer: "Relation D"
      },
      {
        question: `What is an important application of ${topic}?`,
        options: ["Application A", "Application B", "Application C", "Application D"],
        correctAnswer: "Application A"
      }
    ];
  }
};

export const generateEvaluationReport = async (results, topics) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Create a summary of results for the AI
    const resultsSummary = topics.map(topic => {
      const result = results[topic];
      return `${topic}: ${result.correct}/${result.total} (${result.passed ? 'PASSED' : 'FAILED'})`;
    }).join('\n');

    const totalTopics = topics.length;
    const passedTopics = topics.filter(topic => results[topic].passed).length;
    const failedTopics = totalTopics - passedTopics;

    const prompt = `
You are an educational AI assistant. Based on the following evaluation results, provide a personalized report with a general remark and recommendations.

Evaluation Results:
${resultsSummary}

Summary:
- Total topics evaluated: ${totalTopics}
- Topics passed: ${passedTopics}
- Topics failed: ${failedTopics}
- Passing criteria: 4/5 questions correct per topic

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
        remark: `You completed the evaluation with ${passedTopics} out of ${totalTopics} topics passed. ${failedTopics > 0 ? 'Focus on the failed topics to strengthen your foundation.' : 'Great job on passing all topics!'}`,
        recommendations: failedTopics > 0 
          ? ["Review the topics you didn't pass", "Practice more questions on weak areas", "Seek additional resources for difficult concepts"]
          : ["Continue to the main learning material", "You have a solid foundation in the prerequisites"]
      };
    }
  } catch (error) {
    console.error('Error generating evaluation report:', error);
    // Return fallback report
    const passedTopics = topics.filter(topic => results[topic].passed).length;
    const totalTopics = topics.length;
    const failedTopics = totalTopics - passedTopics;
    
    return {
      remark: `You completed the evaluation with ${passedTopics} out of ${totalTopics} topics passed. ${failedTopics > 0 ? 'Focus on the failed topics to strengthen your foundation.' : 'Great job on passing all topics!'}`,
      recommendations: failedTopics > 0 
        ? ["Review the topics you didn't pass", "Practice more questions on weak areas", "Seek additional resources for difficult concepts"]
        : ["Continue to the main learning material", "You have a solid foundation in the prerequisites"]
    };
  }
};

export const generateSubtopics = async (topic) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an educational AI assistant. For the topic "${topic}", generate a list of 4-6 key subtopics that need to be covered for a comprehensive understanding.

Each subtopic should be:
1. A specific aspect or component of the main topic
2. Logically sequenced for learning
3. Essential for understanding the overall topic
4. Concise and clear

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
        `Introduction to ${topic}`,
        `Key Concepts in ${topic}`,
        `Applications of ${topic}`,
        `Advanced Topics in ${topic}`
      ];
    }
  } catch (error) {
    console.error('Error generating subtopics:', error);
    // Return fallback subtopics
    return [
      `Introduction to ${topic}`,
      `Key Concepts in ${topic}`,
      `Applications of ${topic}`,
      `Advanced Topics in ${topic}`
    ];
  }
};

export const generateSubtopicContent = async (subtopic) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an educational AI assistant. Generate educational content for the subtopic: "${subtopic}"

The content should be:
1. Approximately 300 words
2. Clear and easy to understand
3. Educational and informative
4. Well-structured with good flow
5. Engaging for learners

Provide comprehensive coverage of the subtopic while keeping it accessible. Use examples where helpful.

Return only the content text, no additional formatting or explanations.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text.trim();
  } catch (error) {
    console.error('Error generating subtopic content:', error);
    // Return fallback content
    return `This section covers ${subtopic}. This is an important concept that forms a fundamental part of understanding the broader topic. The key principles and applications will be explained to help you build a solid foundation in this area.`;
  }
};

export const rephraseContent = async (content) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an educational AI assistant. Rephrase the following content to make it simpler and easier to understand while maintaining all the key information:

"${content}"

The rephrased content should:
1. Use simpler vocabulary and shorter sentences
2. Be more accessible to beginners
3. Maintain the same educational value
4. Keep approximately the same length
5. Use more basic language and clearer explanations

Return only the rephrased content, no additional text.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text.trim();
  } catch (error) {
    console.error('Error rephrasing content:', error);
    // Return original content if rephrasing fails
    return content;
  }
};

export const answerQuestion = async (question) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an educational AI assistant. Answer the following question in a clear, helpful, and educational manner:

"${question}"

Provide a comprehensive but concise answer that:
1. Directly addresses the question
2. Is easy to understand
3. Includes relevant examples if helpful
4. Is educational and informative
5. Is approximately 100-200 words

Return only the answer, no additional text.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text.trim();
  } catch (error) {
    console.error('Error answering question:', error);
    // Return fallback answer
    return "I'm sorry, I couldn't generate an answer to your question at the moment. Please try rephrasing your question or ask for help from your instructor.";
  }
};
