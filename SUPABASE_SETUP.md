# Supabase Setup Guide for Grasphoffer

This guide will help you set up Supabase for the Grasphoffer learning platform.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `grasphoffer`
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose the closest region to your users
6. Click "Create new project"
7. Wait for the project to be set up (usually takes 1-2 minutes)

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## 3. Configure Environment Variables

1. Open the `.env` file in your project root
2. Replace the placeholder values with your actual Supabase credentials:

```bash
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-actual-anon-key
```

## 4. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click "Run" to execute the SQL
5. Verify that the tables were created by going to **Table Editor**

You should see the following tables:
- `user_profiles`
- `learning_topics`
- `learning_sessions`
- `knowledge_assessments`
- `quiz_attempts`
- `learning_progress`

## 5. Configure Authentication

1. Go to **Authentication** → **Settings**
2. Under **Site URL**, add your local development URL: `http://localhost:3000`
3. Under **Redirect URLs**, add: `http://localhost:3000`
4. Make sure **Enable email confirmations** is enabled (default)

## 6. Test the Setup

1. Start your development server:
   ```bash
   npm start
   ```

2. Go to `http://localhost:3000`
3. Try signing up with a test email
4. Check your email for the confirmation link
5. After confirming, try logging in

## 7. Verify Database Integration

After successful authentication:
1. Go to **Authentication** → **Users** in Supabase dashboard
2. You should see your test user
3. Go to **Table Editor** → **user_profiles**
4. You should see a profile automatically created for your user

## 8. Production Setup (Later)

When deploying to production:
1. Update the **Site URL** and **Redirect URLs** in Supabase Authentication settings
2. Update your `.env` file with production URLs
3. Make sure to keep your Supabase credentials secure

## Database Schema Overview

The database is designed to support the learning platform's core functionality:

- **user_profiles**: Extended user information beyond Supabase auth
- **learning_topics**: Catalog of available learning topics
- **learning_sessions**: User's learning journey for specific topics
- **knowledge_assessments**: Track user's familiarity with concepts
- **quiz_attempts**: Store quiz results and progress
- **learning_progress**: Track detailed progress through learning phases

## Security Features

- **Row Level Security (RLS)**: Ensures users can only access their own data
- **Automatic triggers**: User profiles are created automatically on signup
- **Data validation**: Constraints ensure data integrity

## Troubleshooting

### Common Issues:

1. **"Invalid API key"**: Double-check your environment variables
2. **"Cannot connect to Supabase"**: Verify your project URL is correct
3. **"Email not confirmed"**: Check your spam folder and confirm your email
4. **SQL errors**: Make sure you ran the complete schema migration

### Getting Help:

- Check the Supabase documentation: https://supabase.com/docs
- Join the Supabase Discord: https://discord.supabase.com
- Review the project logs in the Supabase dashboard
