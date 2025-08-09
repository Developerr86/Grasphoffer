# Gemini API Test Script

This simple test script (`test-gemini.js`) helps you verify that your Gemini API integration is working correctly before using it in the main application.

## 🚀 How to Run the Test

```bash
node test-gemini.js
```

## 🔍 What the Test Does

1. **Checks Environment Variables**: Verifies that your API key is configured in `.env`
2. **Tests API Connection**: Makes a real API call to Gemini Pro
3. **Tests Response Parsing**: Ensures the AI returns properly formatted JSON
4. **Tests Multiple Topics**: Tries different learning topics to verify consistency

## ✅ Expected Output (Success)

```
🚀 Testing Gemini API...

✅ API key found in environment variables
🔑 API key: AIzaSyCB...0zEo

🔄 Sending test request to Gemini API...
✅ API call successful!
📝 Raw response:
["Linear Algebra", "Statistics and Probability", "Python Programming", "Calculus", "Data Analysis"]

✅ JSON parsing successful!
📚 Generated prerequisites for "Machine Learning":
   1. Linear Algebra
   2. Statistics and Probability
   3. Python Programming
   4. Calculus
   5. Data Analysis

🎉 Gemini API integration is working perfectly!
```

## ❌ Common Issues and Solutions

### 1. **API Key Not Configured**
```
❌ Gemini API key not configured!
Please add your actual API key to the .env file:
REACT_APP_GEMINI_API_KEY=your-actual-api-key
```

**Solution**: Add your Gemini API key to the `.env` file.

### 2. **API Key Expired** (Current Issue)
```
❌ API call failed!
Error details: API key expired. Please renew the API key.
```

**Solution**: 
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Generate a new API key
3. Replace the old key in your `.env` file

### 3. **API Key Invalid**
```
❌ API call failed!
Error details: API_KEY_INVALID
```

**Solution**: Double-check that you copied the API key correctly.

### 4. **Permission Denied**
```
❌ API call failed!
Error details: PERMISSION_DENIED
```

**Solution**: Ensure your API key has access to the Gemini 2.0 Flash model.

### 5. **Quota Exceeded**
```
❌ API call failed!
Error details: QUOTA_EXCEEDED
```

**Solution**: Check your usage limits in Google AI Studio.

## 🔧 Getting a New Gemini API Key

1. **Visit Google AI Studio**: Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. **Sign in**: Use your Google account
3. **Create API Key**: Click "Create API Key"
4. **Copy the Key**: Copy the generated key
5. **Update .env**: Replace the old key in your `.env` file:
   ```
   REACT_APP_GEMINI_API_KEY=your-new-api-key-here
   ```
6. **Run Test**: Execute `node test-gemini.js` to verify it works

## 📋 Test Script Features

- **Comprehensive Error Handling**: Clear error messages with suggestions
- **Multiple Test Cases**: Tests different topics to ensure consistency
- **JSON Validation**: Verifies that the AI returns properly formatted data
- **Rate Limiting**: Includes delays between requests to avoid hitting limits
- **Detailed Logging**: Shows each step of the testing process

## 🧹 Cleanup

You can safely delete `test-gemini.js` after verifying your API is working. It's only needed for testing purposes.

## 🔄 Re-running Tests

Run the test script anytime you:
- Update your API key
- Suspect API issues
- Want to verify the integration is still working
- Test with different topics

The script is lightweight and safe to run multiple times.
