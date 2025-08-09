-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user profiles table
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learning topics table
CREATE TABLE learning_topics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user learning sessions table
CREATE TABLE learning_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES learning_topics(id) ON DELETE CASCADE,
    target_topic TEXT NOT NULL,
    current_phase TEXT CHECK (current_phase IN ('prerequisite', 'main', 'advanced')),
    status TEXT CHECK (status IN ('in_progress', 'completed', 'paused')) DEFAULT 'in_progress',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user knowledge assessments table
CREATE TABLE knowledge_assessments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,
    concept TEXT NOT NULL,
    user_familiarity_level INTEGER CHECK (user_familiarity_level BETWEEN 1 AND 5),
    assessment_score INTEGER CHECK (assessment_score BETWEEN 0 AND 100),
    needs_learning BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz attempts table
CREATE TABLE quiz_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,
    concept TEXT NOT NULL,
    phase TEXT CHECK (phase IN ('prerequisite', 'main', 'advanced')),
    questions_data JSONB NOT NULL, -- Store questions and user answers
    score INTEGER CHECK (score BETWEEN 0 AND 100),
    passed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learning progress table
CREATE TABLE learning_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,
    concept TEXT NOT NULL,
    phase TEXT CHECK (phase IN ('prerequisite', 'main', 'advanced')),
    status TEXT CHECK (status IN ('not_started', 'learning', 'completed')) DEFAULT 'not_started',
    explanation_level TEXT CHECK (explanation_level IN ('simple', 'detailed')) DEFAULT 'simple',
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS (Row Level Security) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Learning sessions policies
CREATE POLICY "Users can view their own learning sessions" ON learning_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own learning sessions" ON learning_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning sessions" ON learning_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Knowledge assessments policies
CREATE POLICY "Users can view their own assessments" ON knowledge_assessments
    FOR SELECT USING (
        auth.uid() = (SELECT user_id FROM learning_sessions WHERE id = session_id)
    );

CREATE POLICY "Users can create their own assessments" ON knowledge_assessments
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT user_id FROM learning_sessions WHERE id = session_id)
    );

-- Quiz attempts policies
CREATE POLICY "Users can view their own quiz attempts" ON quiz_attempts
    FOR SELECT USING (
        auth.uid() = (SELECT user_id FROM learning_sessions WHERE id = session_id)
    );

CREATE POLICY "Users can create their own quiz attempts" ON quiz_attempts
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT user_id FROM learning_sessions WHERE id = session_id)
    );

-- Learning progress policies
CREATE POLICY "Users can view their own learning progress" ON learning_progress
    FOR SELECT USING (
        auth.uid() = (SELECT user_id FROM learning_sessions WHERE id = session_id)
    );

CREATE POLICY "Users can create their own learning progress" ON learning_progress
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT user_id FROM learning_sessions WHERE id = session_id)
    );

CREATE POLICY "Users can update their own learning progress" ON learning_progress
    FOR UPDATE USING (
        auth.uid() = (SELECT user_id FROM learning_sessions WHERE id = session_id)
    );

-- Learning topics is public read-only
CREATE POLICY "Anyone can view learning topics" ON learning_topics
    FOR SELECT TO authenticated USING (true);

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_learning_sessions_updated_at 
    BEFORE UPDATE ON learning_sessions 
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
