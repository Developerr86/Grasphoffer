# Learning Session Component Guide

This document explains the LearningSession component that handles the topic input and prerequisite selection functionality.

## 🌟 Features

- **Topic Input Interface**: Clean, centered input field matching the reference design
- **Gemini AI Integration**: Uses Google's Gemini API to generate contextual prerequisites
- **Interactive Selection**: Users can click to select/deselect prerequisites they're familiar with
- **Loading States**: Professional loading indicators during API calls
- **Navigation**: Back button to return to dashboard
- **Auto-submission**: Automatically analyzes topics passed from dashboard

## 🎨 UI Components

### 1. **Navigation Icons**
- **Hamburger Menu** (top-left): Returns to dashboard when clicked
- **Profile Icon** (top-right): User profile access

### 2. **Topic Input Form**
- Large, rounded input field with search icon
- Matches the reference design exactly
- Loading spinner in submit button during processing

### 3. **Prerequisites Display**
- **Green Badge**: "Prerequisites :" label
- **Container Box**: Semi-transparent container with rounded corners
- **Selectable Pills**: Clickable prerequisite items that change color when selected
- **Action Buttons**: "Accept All" and "Evaluate" buttons

## 🔧 Technical Implementation

### Gemini AI Integration
```javascript
// lib/gemini.js
export const generatePrerequisites = async (topic) => {
  // Uses Google's Gemini 2.0 Flash model
  // Prompts for exactly 5 relevant prerequisites
  // Returns JSON array of prerequisite strings
  // Includes fallbacks for error handling
}
```

### State Management
```javascript
const [topic, setTopic] = useState(initialTopic);
const [prerequisites, setPrerequisites] = useState([]);
const [selectedPrerequisites, setSelectedPrerequisites] = useState(new Set());
const [loading, setLoading] = useState(false);
```

### Props Interface
```javascript
const LearningSession = ({ 
  topic: initialTopic = '',  // Pre-filled topic from dashboard
  onBack                     // Function to return to dashboard
}) => {
  // Component logic
}
```

## 🎯 User Flow

1. **Topic Entry**: User types their learning topic or arrives with pre-filled topic
2. **AI Analysis**: Gemini AI analyzes the topic and generates 5 relevant prerequisites
3. **Selection Phase**: User clicks on prerequisites they're already familiar with
4. **Action Choice**: User can "Accept All" or manually select specific prerequisites
5. **Evaluation**: Click "Evaluate" to proceed to next phase (to be implemented)

## 🎨 Visual Design

### Color Scheme
- **Background**: Dark gradient (`#2c2c2c` to `#1a1a1a`)
- **Primary Green**: `#4CAF50` for accents and selections
- **Text**: White with various opacity levels
- **Interactive Elements**: Semi-transparent backgrounds with hover effects

### Layout
- **Centered Design**: All content centered vertically and horizontally
- **Responsive**: Adapts to mobile screens
- **Consistent Spacing**: Uses design system spacing (gaps, padding, margins)

### Interactive States
- **Hover Effects**: Subtle animations and color changes
- **Selected State**: Green background and border for selected prerequisites
- **Loading States**: Spinners and disabled states during processing
- **Focus States**: Green borders and glows on input focus

## 🔗 API Integration

### Environment Setup
```bash
# Add to .env file
REACT_APP_GEMINI_API_KEY=your-gemini-api-key
```

### Error Handling
- **Fallback Prerequisites**: Returns default set if API fails
- **JSON Parsing**: Handles malformed API responses
- **User Feedback**: Loading states and error messages

## 📱 Responsive Design

### Desktop (768px+)
- Full-width layout with centered content
- Larger fonts and spacing
- Hover effects enabled

### Mobile (<768px)
- Condensed spacing
- Stacked action buttons
- Touch-friendly button sizes
- Smaller fonts but maintained readability

## 🚀 Integration Points

### Dashboard Integration
```javascript
// App.js handles navigation between components
const handleStartLearning = (topic) => {
  setLearningTopic(topic);
  setCurrentView('learning');
};

// Dashboard passes topic to LearningSession
<LearningSession topic={learningTopic} onBack={handleBackToDashboard} />
```

### Future Extensions
- **Quiz Integration**: "Evaluate" button will trigger assessment quizzes
- **Progress Tracking**: Selected prerequisites saved to database
- **Learning Analytics**: Track user familiarity patterns
- **Content Adaptation**: Use selections to customize learning path

## 🧪 Testing the Component

1. **Start Application**: `npm start`
2. **Navigate to Learning**: Enter topic on dashboard and click "Start Learning"
3. **Test AI Generation**: Try different topics to see prerequisite variations
4. **Test Interactions**: Click prerequisites to select/deselect
5. **Test Navigation**: Use hamburger menu to return to dashboard
6. **Test Responsiveness**: Resize browser to test mobile layout

## 📋 Component Files

- **LearningSession.js**: Main React component
- **LearningSession.css**: Complete styling with responsive design
- **gemini.js**: AI service integration
- **.env**: API key configuration

This component perfectly matches the reference UI images and provides a solid foundation for the next phase of the learning platform!
