/**
 * Gemini Integration - Powered by Nvidia OpenAI API
 * All LLM calls now use REACT_APP_NVIDIA_API_KEY and REACT_APP_NVIDIA_MODEL
 */

import { generateNvidiaStructured, generateNvidiaResponse } from './nvidiallm';

export const generatePrerequisites = async (topic) => {
  try {
    console.log('[NVIDIA LLM] generatePrerequisites called for topic:', topic);

    const prompt = `Generate a list of 5 key prerequisite skills or knowledge areas needed to understand the topic "${topic}".
    Return ONLY a JSON array of strings, like ["skill1", "skill2", ...]. No additional text.`;

    const result = await generateNvidiaStructured(prompt, 'json', {
      max_tokens: 256,
      temperature: 0.7
    });

    if (Array.isArray(result)) {
      return result;
    }
    // Fallback if response isn't properly formatted
    return result.prerequisites || [
      'Basic Mathematics',
      'Logical Thinking',
      'Problem Solving',
      'Computer Basics',
      'Analytical Skills'
    ];
  } catch (error) {
    console.error('Error generating prerequisites:', error);
    // Return fallback data on error
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
    console.log('[NVIDIA LLM] generateMCQQuestions called for topic:', topic);

    const prompt = `Generate 5 multiple choice questions about "${topic}".
    Return a JSON array with objects having: question, options (array of 4), correctAnswer, explanation, whyWrongExplanation, topicCategory, difficultyLevel (easy/medium/hard).
    Return ONLY valid JSON, no additional text.`;

    const questions = await generateNvidiaStructured(prompt, 'json', {
      max_tokens: 2048,
      temperature: 0.8
    });

    if (Array.isArray(questions)) {
      return questions;
    }
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error generating MCQ questions:', error);
    // Return fallback questions on error
    return [
      {
        question: `What is a key concept in ${topic}?`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Option A",
        explanation: `This is a fundamental concept related to ${topic} that forms the foundation of understanding.`,
        whyWrongExplanation: "The other options don't represent core concepts of this topic.",
        topicCategory: "Basic Concepts",
        difficultyLevel: "easy"
      }
    ];
  }
};

export const generateEvaluationReport = async (results, topics) => {
  try {
    console.log('[NVIDIA LLM] generateEvaluationReport called');

    const topicsList = topics.join(', ');
    const resultsJson = JSON.stringify(results);

    const prompt = `Based on the evaluation results for topics: ${topicsList}
    Results: ${resultsJson}
    Generate an encouraging evaluation report with a remark and 3 specific recommendations.
    Return JSON with: remark (string) and recommendations (array of 3 strings).
    Return ONLY valid JSON, no additional text.`;

    const report = await generateNvidiaStructured(prompt, 'json', {
      max_tokens: 512,
      temperature: 0.7
    });

    return report;
  } catch (error) {
    console.error('Error generating evaluation report:', error);
    // Return fallback report
    const totalTopics = topics.length;
    const passedTopics = topics.filter(topic => results[topic]?.passed).length;
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
    console.log('[NVIDIA LLM] generateSubtopics called for topic:', topic);

    const prompt = `Generate 4 subtopic titles for learning about "${topic}".
    Return a JSON array of 4 strings representing subtopics.
    Subtopics should be educational and progressively build understanding.
    Return ONLY valid JSON array, no additional text.`;

    const subtopics = await generateNvidiaStructured(prompt, 'json', {
      max_tokens: 256,
      temperature: 0.8
    });

    if (Array.isArray(subtopics)) {
      return subtopics;
    }
    throw new Error('Invalid response format');
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
    console.log('[NVIDIA LLM] generateSubtopicContent called for subtopic:', subtopic);

    const prompt = `Write an educational explanation of "${subtopic}".
    Write 2-3 paragraphs covering:
    - What is this topic and why is it important
    - Key principles and concepts
    - Real-world applications
    Keep it accessible but informative.`;

    const content = await generateNvidiaResponse(prompt, [], {
      max_tokens: 800,
      temperature: 0.7
    });

    return content;
  } catch (error) {
    console.error('Error generating subtopic content:', error);
    // Return fallback content
    return `This section covers ${subtopic}. This is an important concept that forms a fundamental part of understanding the broader topic. The key principles and applications will be explained to help you build a solid foundation in this area.`;
  }
};

export const rephraseContent = async (content) => {
  try {
    console.log('[NVIDIA LLM] rephraseContent called');

    const prompt = `Please rephrase the following content in a clearer, more engaging way while maintaining the same meaning:

${content}

Provide only the rephrased content, no additional commentary.`;

    const rephrasedContent = await generateNvidiaResponse(prompt, [], {
      max_tokens: 1024,
      temperature: 0.7
    });

    return rephrasedContent;
  } catch (error) {
    console.error('Error rephrasing content:', error);
    return content;
  }
};

export const answerQuestion = async (question) => {
  try {
    console.log('[NVIDIA LLM] answerQuestion called for question:', question);

    const prompt = `Answer the following question clearly and concisely:

${question}

Provide a helpful, educational answer.`;

    const answer = await generateNvidiaResponse(prompt, [], {
      max_tokens: 512,
      temperature: 0.7
    });

    return answer;
  } catch (error) {
    console.error('Error answering question:', error);
    return "I'm sorry, I couldn't generate an answer to your question at the moment. Please try rephrasing your question or I'll do my best to help you in another way!";
  }
};

export const generateResponse = async (message, conversationHistory = []) => {
  try {
    console.log('[NVIDIA LLM] generateResponse called for message:', message);

    const response = await generateNvidiaResponse(message, conversationHistory, {
      max_tokens: 512,
      temperature: 0.8
    });

    return response;
  } catch (error) {
    console.error('Error generating response:', error);
    return "I'm having a bit of trouble right now, but I'm here to help! Could you try asking your question again? I'd love to assist you with your learning journey!";
  }
};

export const detectTopicFromContent = async (markdownContent) => {
  try {
    console.log('[NVIDIA LLM] detectTopicFromContent called');

    const contentPreview = markdownContent.substring(0, 500);
    const prompt = `Based on the following content, identify and describe the main topic:

${contentPreview}

Return a JSON object with: topic (string), description (string), subtopics (array of 3-4 strings), level (beginner/intermediate/advanced/undergraduate), approach (theoretical/practical/mixed).
Return ONLY valid JSON, no additional text.`;

    const detection = await generateNvidiaStructured(prompt, 'json', {
      max_tokens: 512,
      temperature: 0.7
    });

    return detection;
  } catch (error) {
    console.error('Error detecting topic:', error);
    return {
      topic: "Uploaded Content",
      description: "Content extracted from your uploaded files.",
      subtopics: ["Main Concepts"],
      level: "undergraduate",
      approach: "mixed"
    };
  }
};

export const generateFlashcards = async (topic) => {
  try {
    console.log('[NVIDIA LLM] generateFlashcards called for topic:', topic);

    const prompt = `Generate 3 educational flashcards about "${topic}".
    Each flashcard should have a question and a detailed answer.
    Return a JSON array of objects with "question" and "answer" properties.
    Make answers comprehensive but concise (2-3 sentences).
    Return ONLY valid JSON, no additional text.`;

    const flashcards = await generateNvidiaStructured(prompt, 'json', {
      max_tokens: 1024,
      temperature: 0.8
    });

    if (Array.isArray(flashcards)) {
      return flashcards;
    }
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error generating flashcards:', error);
    // Return fallback flashcards
    return [
      {
        question: `What is ${topic}?`,
        answer: `${topic} is an important concept that requires understanding of its fundamental principles and applications. It involves key components that work together to achieve specific outcomes.`
      },
      {
        question: `Why is ${topic} important?`,
        answer: `${topic} is important because it provides essential knowledge and skills that are widely applicable in various contexts and forms the foundation for more advanced learning.`
      },
      {
        question: `What are the key components of ${topic}?`,
        answer: `The key components of ${topic} include several fundamental elements that work together systematically to create a comprehensive understanding of the subject.`
      }
    ];
  }
};
