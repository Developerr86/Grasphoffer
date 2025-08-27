const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Test function for Gemini API
async function testGeminiAPI() {
  console.log('🚀 Testing Gemini API...\n');
  
  // Check if API key is configured
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    console.log('❌ Gemini API key not configured!');
    console.log('Please add your actual API key to the .env file:');
    console.log('REACT_APP_GEMINI_API_KEY=your-actual-api-key\n');
    return;
  }
  
  console.log('✅ API key found in environment variables');
  console.log(`🔑 API key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}\n`);
  
  try {
    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    console.log('🔄 Sending test request to Gemini API...');
    
    // Test prompt
    const testTopic = 'Machine Learning';
    const prompt = `
You are an educational AI assistant. Given a learning topic, provide a comprehensive list of prerequisite knowledge areas that a student should be familiar with before learning the main topic.

Topic: "${testTopic}"

Please provide exactly 5 prerequisite topics that are essential for understanding "${testTopic}". Each prerequisite should be:
1. A fundamental concept or skill needed
2. Specific and focused (not too broad)
3. Logically building toward the main topic

Format your response as a JSON array of strings, like this:
["Prerequisite 1", "Prerequisite 2", "Prerequisite 3", "Prerequisite 4", "Prerequisite 5"]

Only return the JSON array, no additional text or explanation.
`;
    
    // Make API call
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ API call successful!');
    console.log('📝 Raw response:');
    console.log(text);
    console.log();
    
    // Try to parse JSON
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      console.log('🧹 Cleaned response:');
      console.log(cleanText);
      console.log();
      
      const prerequisites = JSON.parse(cleanText.trim());
      
      if (Array.isArray(prerequisites) && prerequisites.length === 5) {
        console.log('✅ JSON parsing successful!');
        console.log('📚 Generated prerequisites for "Machine Learning":');
        prerequisites.forEach((prereq, index) => {
          console.log(`   ${index + 1}. ${prereq}`);
        });
        console.log();
        console.log('🎉 Gemini API integration is working perfectly!');
      } else {
        console.log('⚠️  JSON parsed but format is unexpected');
        console.log('Expected: Array of 5 strings');
        console.log('Got:', prerequisites);
      }
    } catch (parseError) {
      console.log('❌ Failed to parse JSON response');
      console.log('Parse error:', parseError.message);
      console.log('This might be a formatting issue with the AI response');
    }
    
  } catch (error) {
    console.log('❌ API call failed!');
    console.log('Error details:', error.message);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('\n💡 Suggestion: Check if your API key is valid');
      console.log('   - Go to https://makersuite.google.com/app/apikey');
      console.log('   - Generate a new API key if needed');
    } else if (error.message.includes('PERMISSION_DENIED')) {
      console.log('\n💡 Suggestion: Check API permissions');
      console.log('   - Ensure the API key has access to Gemini 2.0 Flash');
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      console.log('\n💡 Suggestion: API quota exceeded');
      console.log('   - Check your usage limits in Google AI Studio');
    }
  }
}

// Additional test with different topic
async function testMultipleTopics() {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 Testing with different topics...\n');
  
  const testTopics = ['React.js', 'Quantum Physics', 'Data Structures'];
  
  for (const topic of testTopics) {
    console.log(`🔄 Testing with topic: "${topic}"`);
    
    try {
      const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const prompt = `Generate exactly 5 prerequisites for learning "${topic}" as a JSON array of strings.`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ Response for "${topic}": ${text.substring(0, 100)}...`);
    } catch (error) {
      console.log(`❌ Failed for "${topic}": ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Run the tests
async function runAllTests() {
  await testGeminiAPI();
  
  if (process.env.REACT_APP_GEMINI_API_KEY && process.env.REACT_APP_GEMINI_API_KEY !== 'your-gemini-api-key') {
    await testMultipleTopics();
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Test completed!');
  console.log('If all tests passed, your Gemini integration is ready to use in the app.');
}

// Execute tests
runAllTests().catch(console.error);
