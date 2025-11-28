# Setup Instructions

## Database Setup

This application requires a Supabase database with the following tables and schema:

### 1. Create Tables

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_attempts table
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  parent_id UUID REFERENCES quiz_attempts,
  questions JSONB NOT NULL,
  answers JSONB DEFAULT '[]'::jsonb,
  selected_lessons TEXT[],
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'draft', 'completed')),
  score INTEGER,
  current_question_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX quiz_attempts_user_id_idx ON quiz_attempts(user_id);
CREATE INDEX quiz_attempts_status_idx ON quiz_attempts(status);
CREATE INDEX quiz_attempts_created_at_idx ON quiz_attempts(created_at DESC);
```

### 2. Set Up Row Level Security (RLS)

Enable RLS and create policies:

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Quiz attempts policies
CREATE POLICY "Users can read their own attempts"
  ON quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attempts"
  ON quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attempts"
  ON quiz_attempts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own draft attempts"
  ON quiz_attempts FOR DELETE
  USING (auth.uid() = user_id AND status = 'draft');

-- Admin policies (optional)
CREATE POLICY "Admins can read all attempts"
  ON quiz_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

### 3. Create Trigger for Profile Creation

Automatically create a profile when a user signs up:

```sql
-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'student');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Get your Supabase credentials:
   - Go to https://app.supabase.com/project/_/settings/api
   - Copy your project URL and anon/public key

3. Update `.env.local` with your actual values:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to the URL shown in the terminal (usually http://localhost:5173)

## Creating Test Users

You can create users in two ways:

### Option 1: Supabase Dashboard
1. Go to Authentication > Users in your Supabase dashboard
2. Click "Add user"
3. Enter email and password
4. The profile will be created automatically via the trigger

### Option 2: Enable Email Signup (Optional)
If you want users to sign up themselves, you can add a signup page:
- Modify `LoginPage.jsx` to include a signup form
- Use `supabase.auth.signUp({ email, password })` to create new users

## Features Implemented

✅ User authentication (login/logout)
✅ Protected routes
✅ Create new quiz attempts
✅ Save quiz progress as drafts
✅ Resume incomplete quizzes
✅ Complete quizzes and save scores
✅ View quiz history
✅ Delete draft attempts
✅ Retry missed questions (creates linked attempts)
✅ All quiz data persisted in database

## Database Schema Reference

### profiles table
- `id`: UUID (primary key, references auth.users)
- `email`: TEXT (unique)
- `role`: TEXT ('student' or 'admin')
- `created_at`: TIMESTAMP

### quiz_attempts table
- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to auth.users)
- `parent_id`: UUID (foreign key to quiz_attempts, for retry chains)
- `questions`: JSONB (array of question objects)
- `answers`: JSONB (array of user answers)
- `selected_lessons`: TEXT[] (array of lesson IDs, e.g., ['lesson1', 'lesson5'])
- `status`: TEXT ('in_progress', 'draft', or 'completed')
- `score`: INTEGER (number of correct answers)
- `current_question_index`: INTEGER (for resuming)
- `created_at`: TIMESTAMP

## Troubleshooting

### "Missing Supabase environment variables"
Make sure `.env.local` exists and contains valid credentials.

### "Invalid API key" or authentication errors
Verify your `VITE_SUPABASE_ANON_KEY` is correct and not expired.

### RLS policy errors
Ensure all RLS policies are created and users have proper permissions.

### Users can't see their data
Check that the `user_id` in quiz_attempts matches `auth.uid()`.

