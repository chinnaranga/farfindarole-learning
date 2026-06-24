-- =============================================================================
-- FarFindARole Learn - Supabase Schema Update (Learning Redesign)
-- =============================================================================

-- Step 1: Drop UNIQUE constraint on quizzes.lesson_id to allow multiple quizzes (Practice vs Graded) per lesson
ALTER TABLE public.quizzes DROP CONSTRAINT IF EXISTS quizzes_lesson_id_key;

-- Step 2: Extend quizzes to support graded and final assessment states
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS is_graded BOOLEAN DEFAULT FALSE;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS is_final BOOLEAN DEFAULT FALSE;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT NULL; -- NULL = unlimited

-- Step 3: Create Quiz Attempts to track graded metrics
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL, -- email
  quiz_id       UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score_percent INTEGER NOT NULL,
  passed        BOOLEAN NOT NULL,
  attempt_num   INTEGER NOT NULL DEFAULT 1,
  completed_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for quiz attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read attempts for owner" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Allow system insert attempts" ON public.quiz_attempts;
CREATE POLICY "Allow read attempts for owner" ON public.quiz_attempts FOR SELECT USING (user_id = auth.email());
CREATE POLICY "Allow system insert attempts" ON public.quiz_attempts FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Step 4: Create Capstone Projects Table
CREATE TABLE IF NOT EXISTS public.capstone_projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID UNIQUE NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL DEFAULT 'Capstone Project',
  description     TEXT NOT NULL, -- markdown description
  guidelines      TEXT DEFAULT '', -- rules / requirements
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create Project Submissions Table
CREATE TABLE IF NOT EXISTS public.project_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL, -- email
  course_id       UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  github_url      TEXT NOT NULL,
  demo_url        TEXT DEFAULT '',
  notes           TEXT DEFAULT '',
  status          VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  feedback        TEXT DEFAULT '',
  reviewed_by     TEXT DEFAULT NULL,
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS for Capstone Projects and Submissions
ALTER TABLE public.capstone_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Open read capstones" ON public.capstone_projects;
DROP POLICY IF EXISTS "Allow read submissions for owner" ON public.project_submissions;
DROP POLICY IF EXISTS "Allow system insert submissions" ON public.project_submissions;

CREATE POLICY "Open read capstones" ON public.capstone_projects FOR SELECT USING (TRUE);
CREATE POLICY "Allow read submissions for owner" ON public.project_submissions FOR SELECT USING (user_id = auth.email());
CREATE POLICY "Allow system insert submissions" ON public.project_submissions FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Step 6: Create Final Assessment Coding Challenges Junction Table
CREATE TABLE IF NOT EXISTS public.final_assessment_challenges (
  course_id    UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.coding_challenges(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, challenge_id)
);

ALTER TABLE public.final_assessment_challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Open read final challenges" ON public.final_assessment_challenges;
DROP POLICY IF EXISTS "System manage final challenges" ON public.final_assessment_challenges;
CREATE POLICY "Open read final challenges" ON public.final_assessment_challenges FOR SELECT USING (TRUE);
CREATE POLICY "System manage final challenges" ON public.final_assessment_challenges FOR ALL WITH CHECK (TRUE);
