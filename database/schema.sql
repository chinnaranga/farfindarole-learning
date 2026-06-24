-- FarFindARole Learn Database Schema
-- Paste this schema into your Supabase SQL Editor to initialize all tables.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  avatar_url VARCHAR,
  role VARCHAR DEFAULT 'student', -- 'student', 'instructor', 'admin'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR, -- 'web-dev', 'backend', 'python', etc.
  difficulty VARCHAR, -- 'beginner', 'intermediate', 'advanced'
  thumbnail_url VARCHAR,
  instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create learning paths table
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR NOT NULL,
  description TEXT,
  courses JSONB, -- Array of course IDs
  target_role VARCHAR, -- e.g., 'frontend-developer'
  estimated_hours INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR NOT NULL,
  content TEXT, -- Lesson content in markdown
  video_url VARCHAR,
  duration_minutes INT,
  order_num INT,
  free_preview BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR,
  time_limit_minutes INT,
  passing_score_percent INT DEFAULT 70,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create quiz questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  options JSONB, -- Array of option objects
  correct_answer_index INT,
  explanation TEXT,
  question_type VARCHAR DEFAULT 'mcq', -- 'mcq', 'short-answer', 'code'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create user progress table
CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completion_percent INT DEFAULT 0,
  time_spent_minutes INT DEFAULT 0,
  last_accessed TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, lesson_id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  verification_code VARCHAR UNIQUE,
  issued_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create quiz results table
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  score INT,
  percentage INT,
  passed BOOLEAN,
  completed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  prompt TEXT,
  rubric JSONB,
  starter_template_url VARCHAR,
  submission_type VARCHAR, -- 'github-link', 'file-upload', 'live-demo'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create skill profiles table
CREATE TABLE IF NOT EXISTS skill_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  skills JSONB, -- Object with skill names and scores
  verified_skills JSONB, -- Skills proven by certificates
  weak_areas JSONB, -- Skills to improve
  job_ready_level INT, -- 0-100
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create job recommendations table
CREATE TABLE IF NOT EXISTS job_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  job_title VARCHAR,
  match_score INT, -- 0-100
  required_skills JSONB,
  missing_skills JSONB,
  recommended_courses JSONB, -- Course IDs to take
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS (Row Level Security) for privacy
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view public courses' AND tablename = 'courses'
  ) THEN
    CREATE POLICY "Users can view public courses" ON courses FOR SELECT USING (published = TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view lessons of published courses' AND tablename = 'lessons'
  ) THEN
    CREATE POLICY "Users can view lessons of published courses" ON lessons FOR SELECT USING (
      EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.published = TRUE)
    );
  END IF;
END
$$;
