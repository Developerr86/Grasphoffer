import { supabase } from './supabase';

/**
 * Database setup utility for creating tables and policies
 * This should be run once to initialize the database schema
 */

/**
 * Check if tables exist in the database
 * @returns {Promise<Object>} Status of table existence
 */
export const checkTablesExist = async () => {
  try {
    // Try to query each table to see if it exists
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('learning_sessions')
      .select('id')
      .limit(1);

    const { data: flashcardsData, error: flashcardsError } = await supabase
      .from('session_flashcards')
      .select('id')
      .limit(1);

    const { data: questionsData, error: questionsError } = await supabase
      .from('session_questions')
      .select('id')
      .limit(1);

    return {
      learning_sessions: !sessionsError,
      session_flashcards: !flashcardsError,
      session_questions: !questionsError,
      allTablesExist: !sessionsError && !flashcardsError && !questionsError
    };
  } catch (error) {
    console.error('Error checking tables:', error);
    return {
      learning_sessions: false,
      session_flashcards: false,
      session_questions: false,
      allTablesExist: false,
      error: error.message
    };
  }
};

/**
 * Create the database tables using SQL
 * Note: This requires the user to have appropriate permissions
 * @returns {Promise<Object>} Setup result
 */
export const createTables = async () => {
  try {
    console.log('Creating database tables...');

    // Create learning_sessions table
    const { error: sessionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS learning_sessions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('fast', 'depth')),
          topic VARCHAR(500) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
          
          -- Session content
          flashcards JSONB,
          mcq_questions JSONB,
          evaluation_results JSONB,
          
          -- Session metadata
          total_flashcards INTEGER DEFAULT 0,
          studied_flashcards INTEGER DEFAULT 0,
          total_questions INTEGER DEFAULT 0,
          correct_answers INTEGER DEFAULT 0,
          final_score DECIMAL(5,2),
          
          -- Timestamps
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          completed_at TIMESTAMP WITH TIME ZONE,
          
          -- Additional fields for depth learning
          prerequisites JSONB,
          prerequisite_results JSONB,
          core_concepts JSONB,
          advanced_concepts JSONB
        );
      `
    });

    if (sessionsError) {
      console.error('Error creating learning_sessions table:', sessionsError);
      return { success: false, error: sessionsError.message };
    }

    // Create session_flashcards table
    const { error: flashcardsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS session_flashcards (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE NOT NULL,
          flashcard_index INTEGER NOT NULL,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          is_studied BOOLEAN DEFAULT FALSE,
          study_time TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (flashcardsError) {
      console.error('Error creating session_flashcards table:', flashcardsError);
      return { success: false, error: flashcardsError.message };
    }

    // Create session_questions table
    const { error: questionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS session_questions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE NOT NULL,
          question_index INTEGER NOT NULL,
          question TEXT NOT NULL,
          options JSONB NOT NULL,
          correct_answer TEXT NOT NULL,
          user_answer TEXT,
          is_correct BOOLEAN,
          answered_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

          -- Additional fields for evaluation report
          topic_category VARCHAR(200),
          difficulty_level VARCHAR(20) DEFAULT 'medium',
          explanation TEXT,
          why_wrong_explanation TEXT
        );
      `
    });

    if (questionsError) {
      console.error('Error creating session_questions table:', questionsError);
      return { success: false, error: questionsError.message };
    }

    // Create topic_struggles table
    const { error: strugglesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS topic_struggles (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          topic_name VARCHAR(200) NOT NULL,
          struggle_count INTEGER DEFAULT 1,
          total_attempts INTEGER DEFAULT 1,
          last_struggled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

          -- Composite unique constraint to prevent duplicates
          UNIQUE(user_id, topic_name)
        );
      `
    });

    if (strugglesError) {
      console.error('Error creating topic_struggles table:', strugglesError);
      return { success: false, error: strugglesError.message };
    }

    console.log('Database tables created successfully');
    return { success: true, message: 'All tables created successfully' };

  } catch (error) {
    console.error('Error creating tables:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Setup Row Level Security policies
 * @returns {Promise<Object>} Setup result
 */
export const setupRLS = async () => {
  try {
    console.log('Setting up Row Level Security policies...');

    // Enable RLS on tables
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE session_flashcards ENABLE ROW LEVEL SECURITY;
        ALTER TABLE session_questions ENABLE ROW LEVEL SECURITY;
      `
    });

    if (rlsError) {
      console.error('Error enabling RLS:', rlsError);
      return { success: false, error: rlsError.message };
    }

    console.log('RLS policies setup completed');
    return { success: true, message: 'RLS policies setup completed' };

  } catch (error) {
    console.error('Error setting up RLS:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Complete database setup
 * @returns {Promise<Object>} Setup result
 */
export const setupDatabase = async () => {
  try {
    console.log('Starting database setup...');

    // Check if tables already exist
    const tableStatus = await checkTablesExist();
    
    if (tableStatus.allTablesExist) {
      console.log('All tables already exist');
      return { 
        success: true, 
        message: 'Database is already set up',
        tablesCreated: false
      };
    }

    // Create tables
    const createResult = await createTables();
    if (!createResult.success) {
      return createResult;
    }

    // Setup RLS
    const rlsResult = await setupRLS();
    if (!rlsResult.success) {
      console.warn('RLS setup failed, but tables were created:', rlsResult.error);
    }

    return { 
      success: true, 
      message: 'Database setup completed successfully',
      tablesCreated: true,
      rlsSetup: rlsResult.success
    };

  } catch (error) {
    console.error('Database setup error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test database connectivity and basic operations
 * @returns {Promise<Object>} Test result
 */
export const testDatabase = async () => {
  try {
    console.log('Testing database connectivity...');

    // Test basic query
    const { data, error } = await supabase
      .from('learning_sessions')
      .select('id')
      .limit(1);

    if (error) {
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      message: 'Database connectivity test passed',
      sessionCount: data?.length || 0
    };

  } catch (error) {
    console.error('Database test error:', error);
    return { success: false, error: error.message };
  }
};
