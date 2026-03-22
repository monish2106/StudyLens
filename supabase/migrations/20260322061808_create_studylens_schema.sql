/*
  # StudyLens Database Schema

  ## Overview
  Complete database schema for StudyLens AI Study Assistant with user authentication,
  document management, study progress tracking, and analytics.

  ## Tables Created

  ### 1. profiles
  - `id` (uuid, references auth.users) - User identifier
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `avatar_url` (text) - Profile picture URL
  - `subscription_tier` (text) - User subscription level (free, pro, premium)
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last profile update

  ### 2. documents
  - `id` (uuid) - Document identifier
  - `user_id` (uuid) - Owner reference
  - `filename` (text) - Original filename
  - `file_size` (int) - File size in bytes
  - `file_type` (text) - Document type (pdf, pptx, docx, etc.)
  - `pages` (int) - Number of pages/slides
  - `language` (text) - Detected language
  - `processing_status` (text) - Status (queued, processing, completed, failed)
  - `is_favorite` (boolean) - Favorited by user
  - `created_at` (timestamptz) - Upload timestamp
  - `processed_at` (timestamptz) - Processing completion time

  ### 3. topics
  - `id` (uuid) - Topic identifier
  - `document_id` (uuid) - Parent document reference
  - `name` (text) - Topic heading
  - `tag` (text) - Category tag
  - `page` (text) - Source page reference
  - `confidence` (int) - Extraction confidence score (0-100)
  - `order_index` (int) - Display order
  - `created_at` (timestamptz)

  ### 4. questions
  - `id` (uuid) - Question identifier
  - `document_id` (uuid) - Parent document reference
  - `topic_id` (uuid) - Related topic reference
  - `question_text` (text) - The question
  - `answer_text` (text) - Example answer
  - `tag` (text) - Category tag
  - `page` (text) - Source page reference
  - `confidence` (int) - Confidence score (0-100)
  - `is_bookmarked` (boolean) - User bookmarked
  - `created_at` (timestamptz)

  ### 5. diagrams
  - `id` (uuid) - Diagram identifier
  - `document_id` (uuid) - Parent document reference
  - `title` (text) - Diagram title
  - `type` (text) - Diagram type
  - `description` (text) - Description
  - `page` (text) - Source page reference
  - `confidence` (int) - Detection confidence
  - `visual_type` (text) - Rendering type
  - `callouts` (jsonb) - Labeled callout data
  - `created_at` (timestamptz)

  ### 6. study_sessions
  - `id` (uuid) - Session identifier
  - `user_id` (uuid) - Student reference
  - `document_id` (uuid) - Document being studied
  - `questions_answered` (int) - Number of questions answered
  - `correct_answers` (int) - Number correct
  - `time_spent_minutes` (int) - Study duration
  - `started_at` (timestamptz) - Session start
  - `completed_at` (timestamptz) - Session end

  ### 7. user_stats
  - `id` (uuid) - Stats identifier
  - `user_id` (uuid) - User reference (unique)
  - `total_documents` (int) - Documents uploaded
  - `total_questions` (int) - Total questions generated
  - `total_study_time_minutes` (int) - Lifetime study time
  - `streak_days` (int) - Current study streak
  - `last_activity` (timestamptz) - Last activity timestamp
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Authenticated users only
  - Policies for select, insert, update, delete operations
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  avatar_url text DEFAULT '',
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'premium')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- DOCUMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  file_size int DEFAULT 0,
  file_type text DEFAULT '',
  pages int DEFAULT 0,
  language text DEFAULT 'English',
  processing_status text DEFAULT 'queued' CHECK (processing_status IN ('queued', 'processing', 'completed', 'failed')),
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- TOPICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS topics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  tag text DEFAULT 'General',
  page text DEFAULT '',
  confidence int DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view topics from own documents"
  ON topics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = topics.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert topics to own documents"
  ON topics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = topics.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update topics from own documents"
  ON topics FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = topics.document_id
      AND documents.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = topics.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete topics from own documents"
  ON topics FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = topics.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- ============================================================================
-- QUESTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  topic_id uuid REFERENCES topics(id) ON DELETE SET NULL,
  question_text text NOT NULL,
  answer_text text NOT NULL,
  tag text DEFAULT 'General',
  page text DEFAULT '',
  confidence int DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  is_bookmarked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view questions from own documents"
  ON questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = questions.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert questions to own documents"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = questions.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update questions from own documents"
  ON questions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = questions.document_id
      AND documents.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = questions.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete questions from own documents"
  ON questions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = questions.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- ============================================================================
-- DIAGRAMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS diagrams (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  type text DEFAULT 'Generic',
  description text DEFAULT '',
  page text DEFAULT '',
  confidence int DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  visual_type text DEFAULT 'generic',
  callouts jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE diagrams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view diagrams from own documents"
  ON diagrams FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = diagrams.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert diagrams to own documents"
  ON diagrams FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = diagrams.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update diagrams from own documents"
  ON diagrams FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = diagrams.document_id
      AND documents.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = diagrams.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete diagrams from own documents"
  ON diagrams FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = diagrams.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- ============================================================================
-- STUDY_SESSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  questions_answered int DEFAULT 0,
  correct_answers int DEFAULT 0,
  time_spent_minutes int DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own study sessions"
  ON study_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sessions"
  ON study_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study sessions"
  ON study_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own study sessions"
  ON study_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- USER_STATS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_stats (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_documents int DEFAULT 0,
  total_questions int DEFAULT 0,
  total_study_time_minutes int DEFAULT 0,
  streak_days int DEFAULT 0,
  last_activity timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON user_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_topics_document_id ON topics(document_id);
CREATE INDEX IF NOT EXISTS idx_questions_document_id ON questions(document_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_diagrams_document_id ON diagrams(document_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_document_id ON study_sessions(document_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Trigger for user_stats table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_stats_updated_at'
  ) THEN
    CREATE TRIGGER update_user_stats_updated_at
      BEFORE UPDATE ON user_stats
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  
  INSERT INTO user_stats (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on auth.users insert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;
