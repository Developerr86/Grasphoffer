# Grasphoffer - AI-Powered Learning Platform

Grasphoffer is a web-based learning platform that uses LLM to help users understand complex topics by teaching prerequisite knowledge, assessing understanding, and building up to advanced concepts in a structured, tree-like learning approach.

## 🌟 Features

- **Structured Learning Path**: Prerequisite → Main Topic → Advanced Concepts
- **Interactive Assessments**: MCQ quizzes to test understanding
- **Adaptive Explanations**: Simple or detailed explanations based on user preference
- **Progress Tracking**: Monitor learning journey across different phases
- **User Authentication**: Secure sign-up and login with Supabase

## 🏗️ Architecture

The learning structure follows a tree pattern:
- **Roots (Prerequisites)**: Foundational concepts required for the main topic
- **Trunk (Main Topic)**: Core concepts the user wants to learn
- **Branches (Advanced)**: Specialized and advanced concepts building on the main topic

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Supabase account
- A Google AI (Gemini) API key

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Developerr86/Grasphoffer.git
   cd Grasphoffer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   - Update `.env` with your actual credentials:
   ```bash
   REACT_APP_SUPABASE_URL=your-supabase-project-url
   REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
   REACT_APP_GEMINI_API_KEY=your-gemini-api-key
   ```

4. **Set up Supabase** (Follow detailed instructions in `SUPABASE_SETUP.md`):
   - Create a new Supabase project
   - Run the SQL migration from `supabase/migrations/001_initial_schema.sql`
   - Get your project URL and anon key from the Supabase dashboard

5. **Get Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Add it to your `.env` file

6. **Start the development server**:
   ```bash
   npm start
   ```

7. **Open your browser** and navigate to `http://localhost:3000`

## 📁 Project Structure

```
grasphoffer_warp/
├── public/                     # Public assets
├── src/
│   ├── components/             # React components
│   │   ├── Auth.js            # Authentication component
│   │   ├── Auth.css           # Auth component styles
│   │   ├── Dashboard.js       # Main dashboard
│   │   └── Dashboard.css      # Dashboard styles
│   ├── context/               # React contexts
│   │   └── AuthContext.js     # Authentication context
│   ├── lib/                   # Utility libraries
│   │   └── supabase.js       # Supabase client configuration
│   ├── App.js                 # Main app component
│   ├── App.css               # Global styles
│   └── index.js              # App entry point
├── supabase/
│   └── migrations/            # Database migration files
│       └── 001_initial_schema.sql
├── .env                       # Environment variables
├── SUPABASE_SETUP.md         # Detailed Supabase setup guide
└── README.md                 # This file
```

## 🗄️ Database Schema

The application uses PostgreSQL through Supabase with the following tables:

- **user_profiles**: Extended user information
- **learning_topics**: Catalog of available topics
- **learning_sessions**: User's learning journeys
- **knowledge_assessments**: User familiarity tracking
- **quiz_attempts**: Quiz results and scores
- **learning_progress**: Detailed progress tracking

## 🔒 Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Authentication**: Handled by Supabase Auth
- **Data Validation**: Database constraints ensure data integrity
- **Automatic Triggers**: User profiles created on signup

## 🎨 UI/UX Design

- **Dark Theme**: Modern dark gradient background
- **Responsive Design**: Works on desktop and mobile
- **Smooth Animations**: Hover effects and transitions
- **Accessible**: High contrast and readable fonts
- **Professional**: Clean, minimalist interface

## 🧪 Testing the Application

1. **Sign Up**: Create a new account with your email
2. **Email Confirmation**: Check your email and confirm your account
3. **Login**: Use your credentials to log in
4. **Dashboard**: You should see the main dashboard with topic input

## ✅ Completed Components

### 1. **Authentication System** 
- Login/Signup with email verification
- Secure session management with Supabase
- Professional dark-themed UI

### 2. **Learning Session Interface**
- Topic input with Gemini AI integration
- AI-generated prerequisite analysis
- Interactive prerequisite selection
- Seamless navigation between dashboard and learning session
- Matches reference UI design exactly

## 🔮 Next Steps

Next components to build:

1. **Knowledge Assessment Quizzes**: MCQ tests for selected prerequisites
2. **Learning Content Generator**: AI-powered explanations and teaching materials
3. **Progress Tracking**: Visual progress through learning phases
4. **Advanced Topics**: Branching into specialized areas
5. **Session Management**: Save and resume learning sessions

## 📚 Tech Stack

- **Frontend**: React.js with hooks
- **Backend**: Supabase (PostgreSQL, Auth)
- **AI Integration**: Google Gemini AI API
- **Styling**: CSS3 with modern features
- **State Management**: React Context API
- **Authentication**: Supabase Auth

## 🐛 Troubleshooting

- **Supabase Connection Error**: Check environment variables in `.env`
- **Gemini AI Error**: Verify your API key is valid and has quota
- **Email Not Received**: Check spam folder for verification emails
- **Build Errors**: Run `npm install` to ensure all dependencies are installed
- **Styling Issues**: Clear browser cache and hard refresh
- **Environment Variables**: Make sure `.env` file is in the root directory and not committed to git

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com/) for the backend infrastructure
- [Google Gemini AI](https://ai.google.dev/) for AI-powered learning content
- [React](https://reactjs.org/) for the frontend framework

---

**Happy Learning with Grasphoffer! 🌱**
