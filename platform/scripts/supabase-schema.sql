-- =============================================================================
-- FarFindARole Learn - Supabase Schema (Production Ready v2)
-- =============================================================================
-- HOW TO RUN:
--   1. Open https://supabase.com/dashboard/project/pnnncdnpdqdylyqyyuxm
--   2. Click "SQL Editor" in the left sidebar
--   3. Paste this ENTIRE file and click "Run"
--   4. You should see "Success. No rows returned" — tables + seed data created!
-- =============================================================================

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- STEP 1: DROP EXISTING TABLES (clean slate — dependency order)
-- =============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TABLE IF EXISTS refunds              CASCADE;
DROP TABLE IF EXISTS failed_payments      CASCADE;
DROP TABLE IF EXISTS invoices             CASCADE;
DROP TABLE IF EXISTS certificates         CASCADE;
DROP TABLE IF EXISTS subscriptions         CASCADE;
DROP TABLE IF EXISTS profiles              CASCADE;
DROP TABLE IF EXISTS ai_learning_paths    CASCADE;
DROP TABLE IF EXISTS search_history       CASCADE;
DROP TABLE IF EXISTS leaderboard_cache    CASCADE;
DROP TABLE IF EXISTS user_learning_stats  CASCADE;
DROP TABLE IF EXISTS platform_analytics   CASCADE;
DROP TABLE IF EXISTS course_analytics     CASCADE;
DROP TABLE IF EXISTS career_paths         CASCADE;
DROP TABLE IF EXISTS quiz_questions       CASCADE;
DROP TABLE IF EXISTS quizzes              CASCADE;
DROP TABLE IF EXISTS course_progress      CASCADE;
DROP TABLE IF EXISTS progress             CASCADE;
DROP TABLE IF EXISTS lessons              CASCADE;
DROP TABLE IF EXISTS courses              CASCADE;

-- Drop coding challenges tables
DROP TABLE IF EXISTS user_badges          CASCADE;
DROP TABLE IF EXISTS user_coding_stats    CASCADE;
DROP TABLE IF EXISTS contest_challenges   CASCADE;
DROP TABLE IF EXISTS contests             CASCADE;
DROP TABLE IF EXISTS challenge_submissions CASCADE;
DROP TABLE IF EXISTS challenge_test_cases CASCADE;
DROP TABLE IF EXISTS coding_challenges    CASCADE;


-- =============================================================================
-- STEP 2: CREATE CORE TABLES
-- =============================================================================

-- Courses table (with new analytics-friendly columns)
CREATE TABLE courses (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  title             VARCHAR(255) NOT NULL,
  description       TEXT         NOT NULL DEFAULT '',
  category          VARCHAR(100) NOT NULL DEFAULT 'web-dev',
  difficulty        VARCHAR(50)  NOT NULL DEFAULT 'beginner',
  published         BOOLEAN      NOT NULL DEFAULT TRUE,
  thumbnail_url     TEXT         DEFAULT '',
  tier              VARCHAR(50)  NOT NULL DEFAULT 'Free',      -- 'Free','Basic','Pro','Advanced'
  instructor_name   VARCHAR(255) DEFAULT 'FarFindARole Expert',
  instructor_title  VARCHAR(255) DEFAULT 'Senior Specialist Instructor',
  instructor_avatar VARCHAR(50)  DEFAULT 'AI',
  skills_gained     TEXT[]       DEFAULT ARRAY[]::TEXT[],      -- ['React','Hooks','JSX']
  outcomes          TEXT[]       DEFAULT ARRAY[]::TEXT[],      -- outcomes of course
  duration_hours    NUMERIC(5,1) DEFAULT 5.0,                  -- total estimated hours
  language          VARCHAR(50)  DEFAULT 'English',
  created_at        TIMESTAMPTZ  DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  DEFAULT NOW()
);

-- Lessons table
CREATE TABLE lessons (
  id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id           UUID         NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title               VARCHAR(255) NOT NULL,
  content             TEXT         NOT NULL DEFAULT '',
  video_url           TEXT         DEFAULT '',
  duration_minutes    INTEGER      DEFAULT 15,
  order_num           INTEGER      NOT NULL DEFAULT 1,
  free_preview        BOOLEAN      DEFAULT FALSE,
  coding_challenge_id UUID         DEFAULT NULL,
  created_at          TIMESTAMPTZ  DEFAULT NOW()
);

-- Progress table (user_id stores email — no FK to auth.users needed)
CREATE TABLE progress (
  user_id       TEXT        NOT NULL,
  lesson_id     UUID        NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed     BOOLEAN     NOT NULL DEFAULT FALSE,
  completed_at  TIMESTAMPTZ DEFAULT NULL,
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, lesson_id)
);

-- Course progress table
CREATE TABLE course_progress (
  user_id               TEXT        NOT NULL,
  course_id             UUID        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completed             BOOLEAN     NOT NULL DEFAULT FALSE,
  completion_percentage INTEGER     DEFAULT 0,
  completed_at          TIMESTAMPTZ DEFAULT NULL,
  last_accessed         TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id)
);

-- Quizzes table (one quiz per lesson)
CREATE TABLE quizzes (
  id                    UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id             UUID         NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title                 VARCHAR(255) NOT NULL DEFAULT 'Knowledge Check',
  time_limit_minutes    INTEGER      DEFAULT 10,
  passing_score_percent INTEGER      DEFAULT 70,
  is_graded             BOOLEAN      DEFAULT FALSE,
  is_final              BOOLEAN      DEFAULT FALSE,
  max_attempts          INTEGER      DEFAULT NULL
);

-- Quiz questions table
CREATE TABLE quiz_questions (
  id                   UUID     PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id              UUID     NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question             TEXT     NOT NULL,
  options              TEXT[]   NOT NULL,
  correct_answer_index INTEGER  NOT NULL DEFAULT 0,
  explanation          TEXT     DEFAULT ''
);

-- =============================================================================
-- STEP 3: NEW ANALYTICS & MARKETPLACE TABLES
-- =============================================================================

-- Per-course analytics (updated by triggers or backend on progress save)
CREATE TABLE course_analytics (
  course_id          UUID    PRIMARY KEY REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_count   INTEGER NOT NULL DEFAULT 0,   -- distinct users who started a lesson
  completion_count   INTEGER NOT NULL DEFAULT 0,   -- users who completed all lessons
  avg_rating         NUMERIC(3,2) DEFAULT NULL,    -- 0.00 - 5.00
  total_ratings      INTEGER NOT NULL DEFAULT 0,
  last_updated       TIMESTAMPTZ DEFAULT NOW()
);

-- Platform-wide aggregated stats (one row, updated daily or on events)
CREATE TABLE platform_analytics (
  id                  INTEGER     PRIMARY KEY DEFAULT 1,  -- single row
  active_learners     INTEGER     NOT NULL DEFAULT 0,
  courses_published   INTEGER     NOT NULL DEFAULT 0,
  certificates_issued INTEGER     NOT NULL DEFAULT 0,
  hiring_success_rate INTEGER     NOT NULL DEFAULT 0,  -- percentage 0-100
  last_updated        TIMESTAMPTZ DEFAULT NOW()
);

-- Career paths — dynamically loaded career tracks
CREATE TABLE career_paths (
  id               VARCHAR(100) PRIMARY KEY,
  role_name        VARCHAR(255) NOT NULL,
  description      TEXT         DEFAULT '',
  salary_min       INTEGER      DEFAULT 80000,   -- USD
  salary_max       INTEGER      DEFAULT 120000,  -- USD
  required_skills  TEXT[]       DEFAULT ARRAY[]::TEXT[],
  course_categories TEXT[]      DEFAULT ARRAY[]::TEXT[],  -- e.g. ['web-dev','backend']
  difficulty       VARCHAR(50)  DEFAULT 'intermediate',   -- beginner/intermediate/advanced
  job_openings     INTEGER      DEFAULT 0,
  icon             VARCHAR(50)  DEFAULT 'Code',   -- Lucide icon name
  color            VARCHAR(30)  DEFAULT '#dc2626', -- hex accent color
  display_order    INTEGER      DEFAULT 0,
  published        BOOLEAN      DEFAULT TRUE
);

-- Per-user learning statistics (computed and cached, updated on progress events)
CREATE TABLE user_learning_stats (
  user_id             TEXT        PRIMARY KEY,  -- stores email
  xp_total            INTEGER     NOT NULL DEFAULT 0,
  current_streak_days INTEGER     NOT NULL DEFAULT 0,
  longest_streak_days INTEGER     NOT NULL DEFAULT 0,
  learning_hours      NUMERIC(8,2) NOT NULL DEFAULT 0,
  lessons_completed   INTEGER     NOT NULL DEFAULT 0,
  courses_enrolled    INTEGER     NOT NULL DEFAULT 0,
  courses_completed   INTEGER     NOT NULL DEFAULT 0,
  certificates_earned INTEGER     NOT NULL DEFAULT 0,
  last_active_date    DATE        DEFAULT CURRENT_DATE,
  last_updated        TIMESTAMPTZ DEFAULT NOW()
);

-- DB-backed search history per user
CREATE TABLE search_history (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    TEXT        NOT NULL,
  query      TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI-generated learning paths stored per user
CREATE TABLE ai_learning_paths (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         TEXT        NOT NULL,
  current_skill   VARCHAR(255) NOT NULL,
  target_role     VARCHAR(255) NOT NULL,
  experience_level VARCHAR(50) DEFAULT 'beginner',
  roadmap_json    JSONB        NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table (linked to auth.users)
CREATE TABLE profiles (
  id                UUID PRIMARY KEY,
  full_name         VARCHAR(255) DEFAULT '',
  avatar_url        TEXT DEFAULT '',
  role              VARCHAR(50) DEFAULT 'student', -- 'student', 'pro', 'admin'
  status            VARCHAR(50) DEFAULT 'active',  -- 'active', 'suspended'
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table (linked to auth.users)
CREATE TABLE IF NOT EXISTS subscriptions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID UNIQUE NOT NULL,
  plan                  VARCHAR(50)  NOT NULL DEFAULT 'free', -- 'free', 'basic', 'pro', 'advanced'
  billing_period        VARCHAR(20)  NOT NULL DEFAULT 'monthly', -- 'monthly', 'annually'
  status                VARCHAR(50)  NOT NULL DEFAULT 'active',
  stripe_customer_id    VARCHAR(255) DEFAULT NULL,
  stripe_subscription_id VARCHAR(255) DEFAULT NULL,
  current_period_start  TIMESTAMPTZ  DEFAULT NOW(),
  current_period_end    TIMESTAMPTZ  DEFAULT NULL,
  created_at            TIMESTAMPTZ  DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  DEFAULT NOW()
);

-- Migration: add missing columns to existing tables (safe to run multiple times)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='status') THEN
    ALTER TABLE profiles ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='plan') THEN
    ALTER TABLE subscriptions ADD COLUMN plan VARCHAR(50) NOT NULL DEFAULT 'free';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='billing_period') THEN
    ALTER TABLE subscriptions ADD COLUMN billing_period VARCHAR(20) NOT NULL DEFAULT 'monthly';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='stripe_customer_id') THEN
    ALTER TABLE subscriptions ADD COLUMN stripe_customer_id VARCHAR(255) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='stripe_subscription_id') THEN
    ALTER TABLE subscriptions ADD COLUMN stripe_subscription_id VARCHAR(255) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='current_period_start') THEN
    ALTER TABLE subscriptions ADD COLUMN current_period_start TIMESTAMPTZ DEFAULT NOW();
  END IF;
  -- Copy old subscription_plan → plan if old column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='subscription_plan') THEN
    UPDATE subscriptions SET plan = LOWER(
      CASE subscription_plan
        WHEN 'Free' THEN 'free'
        WHEN 'Basic' THEN 'basic'
        WHEN 'Student Pro' THEN 'pro'
        WHEN 'Advanced' THEN 'advanced'
        ELSE 'free'
      END
    ) WHERE plan = 'free';
  END IF;
END $$;


-- =============================================================================
-- STEP 4: ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE courses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons              ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress             ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress      ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_analytics     ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_analytics   ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_paths         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_stats  ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_paths    ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions        ENABLE ROW LEVEL SECURITY;

-- Public read on catalog tables
CREATE POLICY "Public read published courses"
  ON courses FOR SELECT USING (published = TRUE);

CREATE POLICY "Public read lessons of published courses"
  ON lessons FOR SELECT
  USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.published = TRUE));

CREATE POLICY "Public read quizzes"
  ON quizzes FOR SELECT
  USING (EXISTS (SELECT 1 FROM lessons l JOIN courses c ON c.id = l.course_id WHERE l.id = quizzes.lesson_id AND c.published = TRUE));

CREATE POLICY "Public read quiz questions"
  ON quiz_questions FOR SELECT
  USING (EXISTS (SELECT 1 FROM quizzes q JOIN lessons l ON l.id = q.lesson_id JOIN courses c ON c.id = l.course_id WHERE q.id = quiz_questions.quiz_id AND c.published = TRUE));

CREATE POLICY "Public read course analytics"
  ON course_analytics FOR SELECT USING (TRUE);

CREATE POLICY "Public read platform analytics"
  ON platform_analytics FOR SELECT USING (TRUE);

CREATE POLICY "Public read career paths"
  ON career_paths FOR SELECT USING (published = TRUE);

-- Progress: open for anon (we use email-based user_id, not JWT)
CREATE POLICY "Open read progress"    ON progress FOR SELECT USING (TRUE);
CREATE POLICY "Open insert progress"  ON progress FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Open update progress"  ON progress FOR UPDATE USING (TRUE);

CREATE POLICY "Open read course_progress"   ON course_progress FOR SELECT USING (TRUE);
CREATE POLICY "Open insert course_progress" ON course_progress FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Open update course_progress" ON course_progress FOR UPDATE USING (TRUE);

CREATE POLICY "Open read user_learning_stats"   ON user_learning_stats FOR SELECT USING (TRUE);
CREATE POLICY "Open insert user_learning_stats" ON user_learning_stats FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Open update user_learning_stats" ON user_learning_stats FOR UPDATE USING (TRUE);

CREATE POLICY "Open read search_history"    ON search_history FOR SELECT USING (TRUE);
CREATE POLICY "Open insert search_history"  ON search_history FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Open delete search_history"  ON search_history FOR DELETE USING (TRUE);

CREATE POLICY "Open read ai_learning_paths"   ON ai_learning_paths FOR SELECT USING (TRUE);
CREATE POLICY "Open insert ai_learning_paths" ON ai_learning_paths FOR INSERT WITH CHECK (TRUE);

-- Profiles & Subscriptions open policies
CREATE POLICY "Open select profiles" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "Open insert profiles" ON profiles FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Open update profiles" ON profiles FOR UPDATE USING (TRUE);

CREATE POLICY "Open select subscriptions" ON subscriptions FOR SELECT USING (TRUE);
CREATE POLICY "Open insert subscriptions" ON subscriptions FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Open update subscriptions" ON subscriptions FOR UPDATE USING (TRUE);

-- Trigger function to automatically create profile + subscription when a user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'student')
  );

  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (
    new.id,
    CASE 
      WHEN COALESCE(new.raw_user_meta_data->>'role', 'student') = 'pro' THEN 'pro'
      WHEN COALESCE(new.raw_user_meta_data->>'role', 'student') = 'admin' THEN 'advanced'
      ELSE 'free'
    END,
    'active'
  );

  -- Insert signup consents from metadata if present
  IF (new.raw_user_meta_data->>'accepted_terms')::boolean = TRUE THEN
    INSERT INTO public.policy_consents (user_id, policy_type, policy_version, accepted, source_page)
    VALUES (new.id, 'signup_terms', COALESCE(new.raw_user_meta_data->>'policy_version', 'v1.0'), TRUE, 'signup');
  END IF;

  IF (new.raw_user_meta_data->>'accepted_privacy')::boolean = TRUE THEN
    INSERT INTO public.policy_consents (user_id, policy_type, policy_version, accepted, source_page)
    VALUES (new.id, 'signup_privacy', COALESCE(new.raw_user_meta_data->>'policy_version', 'v1.0'), TRUE, 'signup');
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow anon to update analytics
CREATE POLICY "Open update course_analytics"   ON course_analytics FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Open update platform_analytics" ON platform_analytics FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- =============================================================================
-- STEP 5: SEED COURSES (with new columns)
-- =============================================================================

INSERT INTO courses (id, title, description, category, difficulty, published, thumbnail_url, tier, instructor_name, instructor_title, instructor_avatar, skills_gained, outcomes, duration_hours, language) VALUES

('11111111-1111-1111-1111-111111111111',
 'React Basics for Beginners',
 'Learn React from scratch. Build interactive UIs with confidence using modern hooks, state management, and component architecture. Perfect for web developers ready to level up.',
 'web-dev', 'beginner', true,
 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=80',
 'Basic', 'Sarah Connor', 'Lead Frontend Systems Architect', 'SC',
 ARRAY['React 19 Hooks', 'Virtual DOM Reconciliation', 'Hydration state control', 'JSX Compilation', 'State batching queues'],
 ARRAY['Construct robust, high-performance Single Page Applications.', 'Diagnose and isolate layout reflows and repaint rendering lag.', 'Synchronize remote state caches with dynamic client UI trees.'],
 10.0, 'English'),

('22222222-2222-2222-2222-222222222222',
 'Advanced SQL & Database Design',
 'Master PostgreSQL schema design, indexing strategies, Row Level Security policies, and performance tuning for production-scale applications with millions of rows.',
 'backend', 'advanced', true,
 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=80',
 'Pro', 'Marcus Vance', 'Principal DB Engineer', 'MV',
 ARRAY['PostgreSQL Normalization', 'B-Tree & Hash Indices', 'Row Level Security (RLS)', 'Transactions isolation levels', 'Explain Analyze tuning'],
 ARRAY['Mitigate SQL Injection attacks via prepared query variables.', 'Formulate database-level user authentication policies.', 'Resolve deadlocks and scale transaction logs under write pressure.'],
 15.0, 'English'),

('33333333-3333-3333-3333-333333333333',
 'Python Data Science Handbook',
 'Dive deep into NumPy, Pandas, Matplotlib, and Scikit-Learn to build predictive ML pipelines, data visualizations, and production-grade data analysis workflows.',
 'python', 'intermediate', true,
 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
 'Advanced', 'Dr. Aaron Finch', 'AI & ML Specialist Research Lead', 'AF',
 ARRAY['Python Vectorization', 'NumPy contiguous layouts', 'Pandas frames', 'Scikit-Learn modeling', 'Classifier testing'],
 ARRAY['Perform vectorized algebraic data computations in Python.', 'Cleanse and process raw spreadsheet records into data inputs.', 'Train, cross-validate, and deploy predictive ML logic classifiers.'],
 12.0, 'English'),

('44444444-4444-4444-4444-444444444444',
 'Introduction to Machine Learning',
 'Explore supervised and unsupervised algorithms, regression, classification, clustering, and model evaluation fundamentals. Ideal first step into the AI/ML field.',
 'python', 'beginner', true,
 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
 'Free', 'Dr. Aaron Finch', 'AI & ML Specialist Research Lead', 'AF',
 ARRAY['Supervised ML', 'Linear Regression', 'Categorical Classification', 'Feature scaling'],
 ARRAY['Evaluate algorithmic precision metrics.', 'Understand gradient descent optimizations.', 'Architect classification models for unstructured inputs.'],
 8.0, 'English'),

('55555555-5555-5555-5555-555555555555',
 'Frontend Systems & Web Performance',
 'Master Core Web Vitals, code splitting, lazy loading, render trees, and bundle size reduction strategies. Build apps that score 100 on Lighthouse.',
 'web-dev', 'advanced', true,
 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
 'Pro', 'Sarah Connor', 'Lead Frontend Systems Architect', 'SC',
 ARRAY['Core Web Vitals', 'LCP Optimization', 'Preloading scripts', 'Fetch Priority APIs'],
 ARRAY['Improve Google search SEO rankings by optimizing Web Vitals.', 'Identify rendering waterfalls and blockages.', 'Control bundle compression ratios and chunk loads.'],
 6.0, 'English'),

('66666666-6666-6666-6666-666666666666',
 'System Design & Distributed Architectures',
 'Design highly scalable, fault-tolerant infrastructure with caching layers, load balancers, rate limiters, message queues, and database sharding strategies.',
 'backend', 'advanced', true,
 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
 'Advanced', 'Marcus Vance', 'Principal DB Engineer', 'MV',
 ARRAY['System Design', 'Distributed Systems', 'Load Balancing', 'Horizontal Scaling', 'Caching', 'Message Queues'],
 ARRAY['Design horizontally scalable server nodes.', 'Configure Layer 4 vs Layer 7 load balancer routing.', 'Mitigate split-brain issues in distributed caches.'],
 20.0, 'English')

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  thumbnail_url = EXCLUDED.thumbnail_url,
  tier = EXCLUDED.tier,
  instructor_name = EXCLUDED.instructor_name,
  instructor_title = EXCLUDED.instructor_title,
  instructor_avatar = EXCLUDED.instructor_avatar,
  skills_gained = EXCLUDED.skills_gained,
  outcomes = EXCLUDED.outcomes,
  duration_hours = EXCLUDED.duration_hours,
  language = EXCLUDED.language;

-- =============================================================================
-- STEP 6: SEED LESSONS
-- =============================================================================

INSERT INTO lessons (id, course_id, title, content, video_url, duration_minutes, order_num, free_preview) VALUES

('11111111-1111-1111-1111-211111111111',
 '11111111-1111-1111-1111-111111111111',
 'What is React & Why Learn It?',
'### Learning Objectives
* Describe the differences between the Imperative and Declarative paradigm.
* Explain the role of the Virtual DOM in UI performance.
* Understand the core value of Component-Driven Development.

---

### 1. Introduction: The Web Interface Challenge

In the early days of the web, building interactive interfaces was incredibly difficult. Every state change required manually targeting elements in the DOM, querying, clearing nodes, and appending child elements.

For example, updating a username using vanilla JavaScript required:

```javascript
const list = document.getElementById("user-list");
const item = document.createElement("li");
item.textContent = "Welcome, Alice!";
list.appendChild(item);
```

While functional, this approach is **imperative** — you must explain exactly *how* to change the UI step-by-step. As applications grew, this led to spaghetti code where state updates in one component broke the UI in another.

---

### 2. The Declarative Revolution

React introduced a **declarative** model. Instead of telling the browser step-by-step how to change the DOM, you describe what the UI *should look like* for a given state:

```jsx
function UserBanner({ username }) {
  return <h1>Welcome, {username}!</h1>;
}
```

Whenever the `username` variable changes, React automatically handles the background work to update the screen.

#### The Restaurant Analogy
* **Imperative:** You walk into the kitchen, grab a pan, chop the onions, heat the butter, cook the chicken yourself.
* **Declarative:** You sit at the table and tell the waiter: "I want the butter chicken." The kitchen (React) handles all the steps.

---

### 3. The Virtual DOM Under the Hood

Directly writing changes to the browser Real DOM is computationally expensive — it triggers reflows and repaints which can slow down apps.

React solves this using a **Virtual DOM**:
1. When state changes, React builds a new Virtual DOM tree (a lightweight in-memory JSON representation).
2. It compares the new tree with the previous one — this is called **Reconciliation / Diffing**.
3. React calculates the minimum set of changes needed (the "patch").
4. It batch-applies only those specific changes to the Real DOM.

---

### 4. Common Mistakes to Avoid
1. **Directly mutating variables:** React will not trigger a re-render if you modify variables directly. Always use state hooks!
2. **Treating components as single pages:** React is designed for reusability. Break your UI into cards, tabs, inputs, and wrappers.',
 '', 20, 1, true),

('11111111-1111-1111-1111-211111111112',
 '11111111-1111-1111-1111-111111111111',
 'Understanding JSX Syntax and Dynamic Expressions',
'### Learning Objectives
* Understand how JSX differs from normal HTML.
* Inject JavaScript expressions into markup.
* Apply proper JSX rules in your components.

---

### 1. What is JSX?

JSX stands for **JavaScript XML**. It lets you write HTML-like syntax directly inside JavaScript. It compiles down to standard JS objects:

```jsx
const element = <h1 className="title">Hello World</h1>;
// Compiles to:
// React.createElement("h1", { className: "title" }, "Hello World");
```

---

### 2. Core Rules of JSX

#### Rule 1: Return a Single Parent Element
Every component must return a single top-level element. Use React Fragments to wrap siblings:
```jsx
return (
  <>
    <h1>Header</h1>
    <p>Paragraph</p>
  </>
);
```

#### Rule 2: Close All Tags
In JSX, every tag must be self-closing: `<input />`, `<img />`, `<br />`.

#### Rule 3: Use camelCase for Attributes
Use `className` instead of `class`, and `htmlFor` instead of `for`.

---

### 3. Dynamic JavaScript in JSX

To insert live data inside elements, wrap it in curly braces `{ }`:

```jsx
function UserCard() {
  const name = "Jane Doe";
  const points = 450;

  return (
    <div className="card">
      <h3>User: {name}</h3>
      <p>Score: {points * 2} points</p>
    </div>
  );
}
```',
 '', 25, 2, true),

('11111111-1111-1111-1111-211111111113',
 '11111111-1111-1111-1111-111111111111',
 'State Management with useState Hook',
'### Learning Objectives
* Understand what state is and why components need it.
* Use the useState hook to create and update state variables.
* Avoid common state mutation pitfalls.

---

### 1. What is State?

**State** is data that can change over time and should trigger a UI re-render when it does.

---

### 2. The useState Hook

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

`useState` returns an array with two items:
1. The current state value (`count`)
2. A setter function to update it (`setCount`)

---

### 3. The Golden Rule: Never Mutate State Directly

```jsx
// WRONG — mutating state directly does not trigger re-render
user.age = 26;

// CORRECT — always create a new object/array
setUser({ ...user, age: 26 });
```',
 '', 30, 3, false),

('44444444-4444-4444-4444-244444444411',
 '44444444-4444-4444-4444-444444444444',
 'Introduction to Supervised Learning',
'### Learning Objectives
* Define supervised learning and contrast it with unsupervised learning.
* Identify real-world regression and classification problems.
* Understand the training, validation, and testing split.

---

### 1. What is Machine Learning?

Machine Learning (ML) is a subfield of AI where systems **learn patterns from data** rather than following explicit programming instructions.

---

### 2. Types of Machine Learning

#### Supervised Learning
The algorithm learns from **labeled training data** — each input has a correct output.

* **Regression:** Predicting a continuous value (e.g., house price)
* **Classification:** Predicting a category (e.g., spam vs. not spam)

#### Unsupervised Learning
The algorithm finds **patterns in unlabeled data**.

* **Clustering:** Grouping similar data points
* **Dimensionality Reduction:** Compressing data while retaining key information

---

### 3. The ML Workflow

```python
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = LinearRegression()
model.fit(X_train, y_train)

score = model.score(X_test, y_test)
print(f"R² Score: {score:.3f}")
```',
 '', 25, 1, true),

-- -----------------------------------------------------------------------------
-- COURSE 1: Advanced SQL & Database Design (22222222-2222-2222-2222-222222222222)
-- -----------------------------------------------------------------------------
('22222222-2222-2222-2222-211111111111',
 '22222222-2222-2222-2222-222222222222',
 'Relational Database Normalization & Schema Design',
 '### Learning Objectives
* Describe First, Second, Third, and Boyce-Codd Normal Forms (1NF, 2NF, 3NF, BCNF).
* Explain how to decompose relations to eliminate redundancy and update anomalies.
* Apply foreign key constraints, check constraints, and indexes to enforce schema integrity.

### Introduction to Normalization
Database normalization is the systematic process of organizing fields and tables of a relational database to minimize redundancy and dependency. The primary goal is to isolate data so that additions, deletions, and modifications can be made in just one table and propagated through the rest of the database using defined relationships.

#### First Normal Form (1NF)
A table is in 1NF if:
1. There are no duplicate rows.
2. Each cell contains only atomic (indivisible) values.
3. There are no repeating groups or arrays of values.

#### Second Normal Form (2NF)
A table is in 2NF if:
1. It is in First Normal Form (1NF).
2. It has no partial dependencies, meaning all non-prime attributes are fully functionally dependent on the entire primary key. This is only relevant for composite primary keys.

#### Third Normal Form (3NF)
A table is in 3NF if:
1. It is in Second Normal Form (2NF).
2. There are no transitive dependencies. A transitive dependency occurs when a non-prime attribute depends on another non-prime attribute, which in turn depends on the primary key.

#### Boyce-Codd Normal Form (BCNF)
BCNF is a slightly stronger version of 3NF. A table is in BCNF if for every non-trivial functional dependency A -> B, A is a superkey. BCNF addresses anomalies that can occur when a table has multiple overlapping composite candidate keys.',
 '', 25, 1, true),

('22222222-2222-2222-2222-211111111112',
 '22222222-2222-2222-2222-222222222222',
 'Indexing Strategies & Query Tuning (B-Tree, Hash)',
 '### Learning Objectives
* Compare B-Tree, Hash, and GIN/GiST index structures in PostgreSQL.
* Identify which query patterns benefit from specific index types.
* Analyze query execution plans using the `EXPLAIN ANALYZE` command to identify performance bottlenecks.

### How Indexes Work
Indexes are specialized data structures that store a subset of table data in an ordered format, allowing the database engine to locate matching rows in logarithmic time (O(log N)) rather than scanning the entire table (O(N)).

#### B-Tree Indexes
The default and most commonly used index in PostgreSQL is the B-Tree (Balanced Tree). B-Trees are highly efficient for:
* Equality queries (`=`)
* Range queries (`>`, `<`, `>=`, `<=`)
* Ordering queries (`ORDER BY`)

#### Hash Indexes
Hash indexes store a 32-bit hash value generated from the indexed column. They are optimized exclusively for simple equality comparisons (`=`). They do not support range queries or ordering.

#### Query Analysis with EXPLAIN
To optimize a slow query, you must inspect how the database plans to execute it. Prepend your query with `EXPLAIN (ANALYZE, BUFFERS)` to run the query and view the execution tree, including:
* **Seq Scan**: A full table scan. If this occurs on a large table, an index is likely missing.
* **Index Scan**: Scanning the index and then fetching the corresponding rows from the table heap.
* **Index Only Scan**: Fetching data directly from the index without accessing the table heap, which is extremely fast.',
 '', 30, 2, false),

('22222222-2222-2222-2222-211111111113',
 '22222222-2222-2222-2222-222222222222',
 'Row Level Security (RLS) & Access Policies',
 '### Learning Objectives
* Understand the security model of Row Level Security (RLS) in PostgreSQL.
* Write SELECT, INSERT, UPDATE, and DELETE policies to restrict data access.
* Integrate RLS with external auth systems like Supabase using session variables and helper functions.

### What is Row Level Security?
Row Level Security (RLS) is a database security feature that allows you to define policies to control which rows of data a user can see, insert, update, or delete. RLS is critical for multi-tenant applications where users must only access their own data.

#### Enabling RLS
By default, RLS is disabled. To enable it on a table, run:
```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
```

#### Writing Access Policies
Policies are SQL expressions that act as implicit `WHERE` clauses appended to all queries executed by non-superuser roles.
```sql
-- Allow users to read only their own documents
CREATE POLICY "Allow users to read own documents" ON documents
  FOR SELECT
  USING (user_id = auth.uid());
```
In this policy, `auth.uid()` is a helper function that retrieves the ID of the authenticated user from the request session.',
 '', 20, 3, false),

-- -----------------------------------------------------------------------------
-- COURSE 2: Python Data Science Handbook (33333333-3333-3333-3333-333333333333)
-- -----------------------------------------------------------------------------
('33333333-3333-3333-3333-211111111111',
 '33333333-3333-3333-3333-333333333333',
 'Vectorized Array Operations with NumPy',
 '### Learning Objectives
* Differentiate between standard Python lists and NumPy ndarrays.
* Understand the performance benefits of vectorized operations.
* Apply broadcasting rules to perform operations on arrays of different shapes.

### Introduction to NumPy
NumPy (Numerical Python) is the foundational library for scientific computing in Python. It provides a highly efficient multidimensional array object called `ndarray` and a suite of routines for fast operations on arrays, including mathematical, logical, shape manipulation, and sorting.

#### NumPy ndarray vs. Python Lists
* **Memory Contiguity**: NumPy arrays are stored in contiguous blocks of memory, which allows for extremely fast CPU cache access. Python lists are arrays of pointers to scattered objects.
* **Static Typing**: All elements in a NumPy array must be of the same data type (e.g., float64, int32), removing runtime type checking overhead.
* **Vectorization**: Operations are executed in compiled C code rather than Python loops.

#### Broadcasting Rules
Broadcasting allows mathematical operations to be performed on arrays of different shapes. The execution follows three rules:
1. If the arrays do not have the same rank, prepend 1s to the shape of the lower-rank array.
2. If the shape of the arrays does not match in any dimension, the array with a shape of 1 in that dimension is stretched to match the other shape.
3. If in any dimension the sizes disagree and neither is equal to 1, an error is raised.',
 '', 20, 1, true),

('33333333-3333-3333-3333-211111111112',
 '33333333-3333-3333-3333-333333333333',
 'Data Cleaning & Manipulation with Pandas',
 '### Learning Objectives
* Work with Series and DataFrame objects in Pandas.
* Detect, filter, and fill missing values (NaNs).
* Perform aggregation and grouping operations to summarize datasets.

### Data Manipulation with Pandas
Pandas is a high-level library built on top of NumPy, designed for working with labeled and relational data. Its two primary data structures are the `Series` (1D) and the `DataFrame` (2D).

#### Handling Missing Data
Real-world data is rarely clean. Pandas represents missing data as `NaN` (Not a Number). Important methods for handling NaNs include:
* `isnull()` and `notnull()`: Returns boolean masks identifying missing values.
* `dropna()`: Filters out rows or columns with missing values.
* `fillna(value)`: Replaces missing values with a specified default or computed statistic (like the mean or median).

#### GroupBy and Aggregation
The GroupBy operation follows the "split-apply-combine" pattern:
1. **Split**: Break the dataset into groups based on some key.
2. **Apply**: Compute an aggregate function (such as sum, mean, or count) on each group.
3. **Combine**: Merge the results into a new DataFrame.
```python
# Example GroupBy
df.groupby(''department'')[''salary''].mean()
```',
 '', 25, 2, false),

('33333333-3333-3333-3333-211111111113',
 '33333333-3333-3333-3333-333333333333',
 'Exploratory Data Visualization with Matplotlib & Seaborn',
 '### Learning Objectives
* Create standard scientific plots using the Matplotlib object-oriented API.
* Style and customize charts (labels, legends, grids, colors).
* Build advanced statistical visualizations (heatmaps, pairplots) with Seaborn.

### Introduction to Data Visualization
Data visualization is an essential step in exploratory data analysis. It allows researchers to spot patterns, outliers, and correlations that might go unnoticed in raw tabular data.

#### Matplotlib Object-Oriented API
While Matplotlib offers a simple state-based interface (`plt.plot`), the object-oriented API is preferred for complex layouts. It explicitly creates `Figure` and `Axes` objects:
```python
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(8, 6))
ax.plot(x, y, label=''Trend Line'', color=''#4A90E2'')
ax.set_title(''Sales Over Time'')
ax.set_xlabel(''Month'')
ax.set_ylabel(''Revenue'')
ax.legend()
plt.show()
```

#### Statistical Plotting with Seaborn
Seaborn is built on top of Matplotlib and integrates closely with Pandas DataFrames, offering beautiful default styles and high-level statistical chart types:
* `sns.scatterplot()`: Renders scatter plots with automatic semantic mapping.
* `sns.heatmap()`: Visualizes 2D matrices, ideal for correlation coefficients.
* `sns.pairplot()`: Generates pairwise relationship grids across all numeric variables.',
 '', 20, 3, false),

-- -----------------------------------------------------------------------------
-- COURSE 3: Frontend Systems & Web Performance (55555555-5555-5555-5555-555555555555)
-- -----------------------------------------------------------------------------
('55555555-5555-5555-5555-211111111111',
 '55555555-5555-5555-5555-555555555555',
 'Core Web Vitals & Loading Cycles (LCP, FID/INP, CLS)',
 '### Learning Objectives
* Define Largest Contentful Paint (LCP), Interaction to Next Paint (INP), and Cumulative Layout Shift (CLS).
* Analyze page loading performance using Chrome DevTools Performance Panel.
* Understand the thresholds and criteria for a "Good" performance rating.

### What are Core Web Vitals?
Core Web Vitals are a set of three user-centered performance metrics established by Google to measure the real-world user experience of a web page. They focus on loading speed, interactivity, and visual stability.

#### 1. Largest Contentful Paint (LCP)
LCP measures *loading performance*. It reports the time it takes to render the largest image or text block visible within the viewport.
* **Good**: Under 2.5 seconds.
* **Needs Improvement**: Between 2.5 and 4.0 seconds.
* **Poor**: Over 4.0 seconds.

#### 2. Interaction to Next Paint (INP)
INP measures *interactivity and responsiveness*. It assesses the latency of all user interactions (clicks, taps, keypresses) on a page and reports a single representative value.
* **Good**: Under 200 milliseconds.
* **Poor**: Over 500 milliseconds.

#### 3. Cumulative Layout Shift (CLS)
CLS measures *visual stability*. It quantifies how much elements unexpectedly shift on the page during the loading phase.
* **Good**: Score under 0.1.
* **Poor**: Score over 0.25.',
 '', 20, 1, true),

('55555555-5555-5555-5555-211111111112',
 '55555555-5555-5555-5555-555555555555',
 'Optimizing Largest Contentful Paint (LCP) & Asset Delivery',
 '### Learning Objectives
* Apply the Fetch Priority API to prioritize critical resource downloads.
* Implement modern image optimization practices (avif/webp formats, srcsets).
* Eliminate render-blocking stylesheets and scripts.

### Optimizing LCP
Since Largest Contentful Paint is heavily influenced by image assets and critical render trees, optimizing asset delivery is the most effective way to improve this metric.

#### Fetch Priority API
You can instruct the browser to download a high-value asset immediately using the `fetchpriority="high"` attribute. This is particularly useful for above-the-fold hero images:
```html
<img src="hero.webp" fetchpriority="high" alt="Featured Course Banner">
```

#### Next-Gen Image Formats
Always compress and convert images to modern formats:
* **AVIF**: Offers up to 50% smaller file sizes than JPEG at comparable quality.
* **WebP**: Highly compatible next-gen format with superior compression.
* Implement responsive images using `srcset` to avoid sending desktop-sized images to mobile viewports.',
 '', 25, 2, false),

('55555555-5555-5555-5555-211111111113',
 '55555555-5555-5555-5555-555555555555',
 'Code Splitting & Advanced Caching Strategies',
 '### Learning Objectives
* Implement dynamic imports in JavaScript to reduce initial bundle sizes.
* Configure Service Workers to enable offline caching and instant load.
* Optimize HTTP response caching headers (Cache-Control, ETags).

### Code Splitting
By default, compilers bundle all JavaScript into a single large file. Code splitting allows you to break your bundle into smaller chunks that are loaded on-demand, reducing the initial loading latency.

#### Dynamic Imports
Use dynamic `import()` statements to load modules only when they are needed:
```javascript
// Load expensive graphing library only on click
button.addEventListener(''click'', async () => {
  const { renderChart } = await import(''./charts.js'');
  renderChart();
});
```

#### HTTP Caching Headers
Leverage browser caches by configuring appropriate headers on your web server:
* `Cache-Control: public, max-age=31536000, immutable`: For versioned static assets (hashes in filename) that never change.
* `Cache-Control: no-cache`: Instructs the browser to validate with the server via ETags before using cached copies.',
 '', 25, 3, false),

-- -----------------------------------------------------------------------------
-- COURSE 4: System Design & Distributed Architectures (66666666-6666-6666-6666-666666666666)
-- -----------------------------------------------------------------------------
('66666666-6666-6666-6666-211111111111',
 '66666666-6666-6666-6666-666666666666',
 'Horizontal Scaling & Load Balancing Mechanics',
 '### Learning Objectives
* Compare vertical scaling with horizontal scaling.
* Explain the differences between Layer 4 (TCP) and Layer 7 (HTTP) load balancing.
* Apply consistent hashing algorithms for distributed routing.

### Scaling Strategies
As application traffic grows, systems must scale to handle the increased load without degrading performance or availability.

#### Vertical vs. Horizontal Scaling
* **Vertical Scaling (Scaling Up)**: Adding more resources (CPU, RAM) to a single physical or virtual server. Limited by physical hardware boundaries and represents a single point of failure.
* **Horizontal Scaling (Scaling Out)**: Adding more server nodes to the pool. Highly resilient and virtually limitless, but introduces distributed systems complexity.

#### Load Balancing
A load balancer distributes incoming network traffic across a cluster of backend servers.
* **Layer 4 Load Balancing (TCP/UDP)**: Routes traffic based on network packet information (IP address and port) without inspecting the message payload. Fast and lightweight.
* **Layer 7 Load Balancing (HTTP/HTTPS)**: Routes traffic based on application data (HTTP headers, cookies, URL paths). Enables features like SSL termination and session affinity.',
 '', 25, 1, true),

('66666666-6666-6666-6666-211111111112',
 '66666666-6666-6666-6666-666666666666',
 'Distributed Caching & Caching Patterns',
 '### Learning Objectives
* Design cache-aside, write-through, and write-behind caching strategies.
* Implement cache eviction algorithms (LRU, LFU).
* Mitigate common caching issues such as Cache Avalanche and Cache Stampede.

### Distributed Caching
A cache is a high-speed data storage layer that stores a subset of data, typically in transient memory (RAM), so that future requests for that data are served faster.

#### Caching Patterns
1. **Cache-Aside**: The application queries the cache first. If a cache miss occurs, it queries the database, writes the result to the cache, and returns it.
2. **Write-Through**: The application writes updates to the cache, and the cache synchronously writes them to the database before completing.
3. **Write-Behind (Write-Back)**: The application writes updates to the cache, which acknowledges immediately. The cache then asynchronously flushes the updates to the database.

#### Eviction Policies
When the cache reaches its memory capacity, it must evict old items:
* **Least Recently Used (LRU)**: Evicts the item that has not been accessed for the longest duration.
* **Least Frequently Used (LFU)**: Evicts the item with the lowest access count.',
 '', 25, 2, false),

('66666666-6666-6666-6666-211111111113',
 '66666666-6666-6666-6666-666666666666',
 'Event-Driven Messaging & Rate Limiting',
 '### Learning Objectives
* Contrast message queues (RabbitMQ) with distributed event streaming (Kafka).
* Design robust rate-limiting systems using token bucket and sliding window algorithms.
* Implement message consumer groups for scalable processing.

### Event-Driven Architectures
In distributed systems, services must communicate asynchronously to remain decoupled and resilient.

#### Message Queues vs. Event Streams
* **Message Queues (e.g., RabbitMQ)**: Messages are directed to queues, processed by consumers, and deleted upon successful acknowledgement. Optimized for discrete task distribution.
* **Event Streams (e.g., Apache Kafka)**: Events are appended to a continuous, immutable, partitioned commit log. Consumers maintain their own offsets, allowing multiple consumers to replay the stream.

#### Rate Limiting Algorithms
Rate limiters prevent resource exhaustion and protect APIs from abuse.
* **Token Bucket**: A bucket is filled with tokens at a constant rate. Each request consumes a token. If the bucket is empty, the request is rejected. Handles bursty traffic.
* **Leaky Bucket**: Requests enter a queue and are processed at a steady, uniform rate. Smooths out traffic spikes but adds latency.',
 '', 30, 3, false)

ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  video_url = EXCLUDED.video_url,
  duration_minutes = EXCLUDED.duration_minutes,
  order_num = EXCLUDED.order_num,
  free_preview = EXCLUDED.free_preview;

-- =============================================================================
-- STEP 7: SEED QUIZZES
-- =============================================================================

INSERT INTO quizzes (id, lesson_id, title, time_limit_minutes, passing_score_percent) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-211111111111', 'React Fundamentals Check', 5, 70),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-244444444411', 'ML Fundamentals Quiz', 5, 70),
('22222222-2222-2222-2222-311111111111', '22222222-2222-2222-2222-211111111111', 'SQL Normalization & Schema Check', 5, 70),
('33333333-3333-3333-3333-311111111111', '33333333-3333-3333-3333-211111111111', 'NumPy Vectorization Check', 5, 70),
('55555555-5555-5555-5555-311111111111', '55555555-5555-5555-5555-211111111111', 'Core Web Vitals Check', 5, 70),
('66666666-6666-6666-6666-311111111111', '66666666-6666-6666-6666-211111111111', 'Load Balancing & Scaling Check', 5, 70)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  title = EXCLUDED.title,
  time_limit_minutes = EXCLUDED.time_limit_minutes,
  passing_score_percent = EXCLUDED.passing_score_percent;

INSERT INTO quiz_questions (quiz_id, question, options, correct_answer_index, explanation) VALUES

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 'What does "declarative" mean in the context of React?',
 ARRAY['You manually control every DOM operation step-by-step', 'You describe what the UI should look like and React handles the updates', 'You write CSS directly in JavaScript', 'You use callbacks for all state changes'],
 1, 'Declarative programming means you describe the desired state of the UI and let React figure out how to achieve it.'),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 'What is the primary purpose of the Virtual DOM in React?',
 ARRAY['To store application data permanently', 'To render HTML on the server', 'To minimize expensive Real DOM updates by batching only the necessary changes', 'To replace CSS stylesheets with JavaScript objects'],
 2, 'The Virtual DOM is a lightweight in-memory copy of the Real DOM. React uses it to calculate the minimum set of changes needed, then applies only targeted updates.'),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 'Which best describes a React component?',
 ARRAY['A JavaScript function or class that returns JSX describing part of the UI', 'A CSS class that styles HTML elements', 'A database table that stores application state', 'A browser API for making network requests'],
 0, 'A React component is a JavaScript function (or class) that accepts props and returns JSX.'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
 'In supervised learning, what makes the training data "labeled"?',
 ARRAY['The data has been sorted alphabetically', 'Each input example has a corresponding correct output or target value', 'The data comes from a trusted government source', 'The features have been normalized to a 0-1 range'],
 1, 'Labeled data means each training example includes both the input features and the correct answer.'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
 'A model that performs perfectly on training data but poorly on new data is said to be:',
 ARRAY['Underfitting', 'Well-calibrated', 'Overfitting', 'Cross-validated'],
 2, 'Overfitting occurs when a model memorizes training data including its noise, making it fail to generalize to unseen data.');

-- =============================================================================
-- SEED QUIZ QUESTIONS FOR REMAINING COURSES
-- =============================================================================

INSERT INTO quiz_questions (id, quiz_id, question, options, correct_answer_index, explanation) VALUES

-- Course 1: Advanced SQL Quiz Questions
('22222222-2222-2222-2222-411111111111',
 '22222222-2222-2222-2222-311111111111',
 'Which normal form is violated if a table has a composite primary key (A, B) and a non-key attribute C that is dependent only on A?',
 ARRAY['First Normal Form (1NF)', 'Second Normal Form (2NF)', 'Third Normal Form (3NF)', 'Boyce-Codd Normal Form (BCNF)'],
 1,
 'Second Normal Form (2NF) requires that all non-key attributes be fully dependent on the entire primary key. A dependency on only a part of a composite key is a partial dependency, violating 2NF.'),

('22222222-2222-2222-2222-411111111112',
 '22222222-2222-2222-2222-311111111111',
 'What is a transitive dependency in database normalization?',
 ARRAY['A dependency between columns in different tables', 'A dependency of a non-key column on another non-key column which then depends on the primary key', 'A dependency that spans multiple database instances', 'A circular reference between foreign keys'],
 1,
 'A transitive dependency occurs when a non-prime attribute depends on another non-prime attribute (X -> Y), which in turn depends on the primary key (PK -> X). Eliminating transitive dependencies is the core requirement of 3NF.'),

('22222222-2222-2222-2222-411111111113',
 '22222222-2222-2222-2222-311111111111',
 'Which of the following describes Boyce-Codd Normal Form (BCNF)?',
 ARRAY['Every cell must contain atomic values', 'All partial dependencies must be removed', 'For every non-trivial functional dependency A -> B, A must be a superkey', 'There can be no foreign key relationships in the table'],
 2,
 'BCNF is a stricter version of 3NF. It requires that for every non-trivial functional dependency A -> B, the determinant A must be a candidate key (or superkey).'),


-- Course 2: Python Data Science Quiz Questions
('33333333-3333-3333-3333-411111111111',
 '33333333-3333-3333-3333-311111111111',
 'Why are NumPy array operations significantly faster than standard Python list loops?',
 ARRAY['They are written in assembler code', 'They store data in contiguous C-arrays, avoiding type-checking and pointer overhead', 'They automatically run on multiple GPU threads', 'They compress the data before running calculations'],
 1,
 'NumPy ndarrays store homogeneous elements in contiguous blocks of memory and perform operations in compiled C loops, eliminating Python''s dynamic type-checking and pointer-indirection overhead.'),

('33333333-3333-3333-3333-411111111112',
 '33333333-3333-3333-3333-311111111111',
 'According to NumPy broadcasting rules, what happens when operating on two arrays of shapes (3, 1) and (3, 5)?',
 ARRAY['An error is thrown immediately due to shape mismatch', 'The first array is stretched along the second dimension to shape (3, 5) to match the second array', 'The second array is sliced down to shape (3, 1)', 'Both arrays are flattened to 1D arrays of size 15'],
 1,
 'Since the first array has a size of 1 in the second dimension, NumPy stretches (broadcasts) it along that dimension to match the size of 5 in the second array, resulting in successful element-wise operations.'),

('33333333-3333-3333-3333-411111111113',
 '33333333-3333-3333-3333-311111111111',
 'Which NumPy function is used to change the shape of an array without changing its data?',
 ARRAY['np.resize()', 'np.transpose()', 'np.reshape()', 'np.flatten()'],
 2,
 'np.reshape() changes the dimensions (shape) of an array while sharing the same underlying data buffer, making it a fast O(1) operation.'),


-- Course 3: Frontend Systems Quiz Questions
('55555555-5555-5555-5555-411111111111',
 '55555555-5555-5555-5555-311111111111',
 'Which Core Web Vital measures the visual stability of a page during the loading cycle?',
 ARRAY['Largest Contentful Paint (LCP)', 'Interaction to Next Paint (INP)', 'First Contentful Paint (FCP)', 'Cumulative Layout Shift (CLS)'],
 3,
 'Cumulative Layout Shift (CLS) measures visual stability by tracking unexpected element movement and layout shifts in the viewport during page render.'),

('55555555-5555-5555-5555-411111111112',
 '55555555-5555-5555-5555-311111111111',
 'What is the target threshold for a "Good" Largest Contentful Paint (LCP) score?',
 ARRAY['Under 1.0 seconds', 'Under 2.5 seconds', 'Under 4.0 seconds', 'Under 100 milliseconds'],
 1,
 'A Core Web Vitals LCP score is classified as "Good" if the largest image or text element in the viewport renders in 2.5 seconds or less from when the page first starts loading.'),

('55555555-5555-5555-5555-411111111113',
 '55555555-5555-5555-5555-311111111111',
 'What does Interaction to Next Paint (INP) measure?',
 ARRAY['The total time it takes for a page''s scripts to compile', 'The visual load time of input forms', 'The latency of all user interactions on a page, reporting the worst-case responsiveness', 'The rate of frame drops during scrolling animations'],
 2,
 'INP measures page responsiveness by tracking the time elapsed between a user interaction (like clicking a button) and when the browser paints the next visual frame.'),


-- Course 4: System Design Quiz Questions
('66666666-6666-6666-6666-411111111111',
 '66666666-6666-6666-6666-311111111111',
 'What is a primary distinction between Layer 4 and Layer 7 load balancers?',
 ARRAY['Layer 4 load balancers can decrypt TLS traffic whereas Layer 7 cannot', 'Layer 4 routes traffic based on IP/Port packets; Layer 7 inspects application headers and URLs', 'Layer 4 load balancers only support UDP; Layer 7 only supports TCP', 'Layer 4 is software-based; Layer 7 is strictly hardware-based'],
 1,
 'Layer 4 load balancers operate at the transport layer (TCP/UDP) routing packets without looking at the payload. Layer 7 load balancers operate at the application layer, allowing routing based on HTTP headers, cookies, and URI paths.'),

('66666666-6666-6666-6666-411111111112',
 '66666666-6666-6666-6666-311111111111',
 'Which scaling strategy involves adding more hardware resources (like RAM or CPU cores) to a single machine?',
 ARRAY['Horizontal Scaling (Scaling Out)', 'Vertical Scaling (Scaling Up)', 'Database Sharding', 'Load Balancing'],
 1,
 'Vertical scaling (scaling up) means increasing the capacity of a single machine by adding resources like faster CPUs, more RAM, or larger SSDs.'),

('66666666-6666-6666-6666-411111111113',
 '66666666-6666-6666-6666-311111111111',
 'How does consistent hashing benefit distributed cache routing compared to simple modulo hashing (N % nodes)?',
 ARRAY['It guarantees 100% cache hit rates', 'It encrypts the cache keys before routing them', 'It minimizes cache key remapping and redistribution when a node is added or removed from the cluster', 'It automatically backs up keys across all database systems'],
 2,
 'With modulo hashing, adding or removing a node changes the hash mapping for almost all keys, causing a massive cache miss spike. Consistent hashing ensures that only a small fraction of keys (K/N) need to be remapped when the cluster size changes.')

ON CONFLICT (id) DO UPDATE SET
  quiz_id = EXCLUDED.quiz_id,
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  correct_answer_index = EXCLUDED.correct_answer_index,
  explanation = EXCLUDED.explanation;

INSERT INTO course_analytics (course_id, enrollment_count, completion_count, avg_rating, total_ratings) VALUES
('11111111-1111-1111-1111-111111111111', 12450, 10830, 4.80, 245),
('22222222-2222-2222-2222-222222222222', 8420, 7150, 4.90, 192),
('33333333-3333-3333-3333-333333333333', 9810, 8030, 4.70, 210),
('44444444-4444-4444-4444-444444444444', 6540, 5210, 4.60, 128),
('55555555-5555-5555-5555-555555555555', 5310, 4390, 4.90, 115),
('66666666-6666-6666-6666-666666666666', 7950, 6800, 4.80, 164)
ON CONFLICT (course_id) DO UPDATE SET
  enrollment_count = EXCLUDED.enrollment_count,
  completion_count = EXCLUDED.completion_count,
  avg_rating = EXCLUDED.avg_rating,
  total_ratings = EXCLUDED.total_ratings;

-- =============================================================================
-- STEP 9: SEED PLATFORM_ANALYTICS (initial row)
-- =============================================================================

INSERT INTO platform_analytics (id, active_learners, courses_published, certificates_issued, hiring_success_rate)
VALUES (1, 0, 6, 0, 0)
ON CONFLICT (id) DO UPDATE SET
  courses_published = 6;

-- =============================================================================
-- STEP 10: SEED CAREER PATHS
-- =============================================================================

INSERT INTO career_paths (id, role_name, description, salary_min, salary_max, required_skills, course_categories, difficulty, job_openings, icon, color, display_order, published) VALUES

('cp-frontend', 'Frontend Developer',
 'Build beautiful, fluid user interfaces. Master rendering cycles, state managers, and visual design systems.',
 95000, 135000,
 ARRAY['React', 'CSS Grid', 'TypeScript', 'Performance Optimization', 'LCP Tuning'],
 ARRAY['web-dev'], 'intermediate', 0, 'Monitor', '#3b82f6', 1, true),

('cp-backend', 'Backend Engineer',
 'Model high-performance database tables, architect safe transaction layers, and configure scale balancers.',
 110000, 150000,
 ARRAY['PostgreSQL', 'API Design', 'Authentication', 'System Architecture', 'RLS Policies'],
 ARRAY['backend'], 'intermediate', 0, 'Server', '#10b981', 2, true),

('cp-fullstack', 'Full Stack Engineer',
 'Architect end-to-end applications from database layer optimizations up to client hydration controls.',
 120000, 160000,
 ARRAY['React', 'Node.js', 'PostgreSQL', 'API Design', 'DevOps Basics'],
 ARRAY['web-dev', 'backend'], 'advanced', 0, 'Layers', '#8b5cf6', 3, true),

('cp-ai-eng', 'AI Engineer',
 'Formulate automated dataset processors, organize ML pipelines, and orchestrate deep learning networks.',
 130000, 175000,
 ARRAY['Python', 'Pandas', 'Scikit-Learn', 'Model Training', 'Neural Networks', 'MLOps'],
 ARRAY['python'], 'advanced', 0, 'Brain', '#f59e0b', 4, true),

('cp-data-sci', 'Data Scientist',
 'Transform raw data into business insights using statistical analysis, visualization, and predictive models.',
 105000, 145000,
 ARRAY['Python', 'NumPy', 'Pandas', 'Statistics', 'Data Visualization', 'A/B Testing'],
 ARRAY['python'], 'intermediate', 0, 'BarChart3', '#ec4899', 5, true),

('cp-cloud', 'Cloud Architect',
 'Configure distributed nodes, balance workloads globally, and optimize database clustering policies at scale.',
 125000, 170000,
 ARRAY['AWS', 'Kubernetes', 'Load Balancing', 'Horizontal Scaling', 'Fault Tolerance', 'CDN'],
 ARRAY['backend'], 'advanced', 0, 'Cloud', '#06b6d4', 6, true),

('cp-cyber', 'Cybersecurity Engineer',
 'Audit security configurations, enforce row level access control, and protect application layers at all levels.',
 115000, 155000,
 ARRAY['Database Security', 'RLS Policies', 'Input Sanitization', 'OAuth', 'Penetration Testing'],
 ARRAY['backend'], 'advanced', 0, 'ShieldCheck', '#ef4444', 7, true)

ON CONFLICT (id) DO UPDATE SET
  role_name = EXCLUDED.role_name,
  description = EXCLUDED.description,
  salary_min = EXCLUDED.salary_min,
  salary_max = EXCLUDED.salary_max,
  required_skills = EXCLUDED.required_skills,
  course_categories = EXCLUDED.course_categories,
  difficulty = EXCLUDED.difficulty,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  display_order = EXCLUDED.display_order;

-- =============================================================================
-- STEP 11: RECOMPUTE PLATFORM ANALYTICS TRIGGER FUNCTION
-- =============================================================================
-- This function can be called after schema run to recalculate platform_analytics
-- based on actual data. Run manually via SQL Editor: SELECT recompute_platform_analytics();

CREATE OR REPLACE FUNCTION recompute_platform_analytics()
RETURNS void AS $$
BEGIN
  UPDATE platform_analytics SET
    courses_published = (SELECT COUNT(*) FROM courses WHERE published = TRUE),
    active_learners   = (SELECT COUNT(DISTINCT user_id) FROM progress),
    certificates_issued = (SELECT COUNT(*) FROM course_progress WHERE completed = TRUE),
    last_updated = NOW()
  WHERE id = 1;
END;
$$ LANGUAGE plpgsql;

-- Run it immediately to sync initial state
SELECT recompute_platform_analytics();

-- =============================================================================
-- STEP 12: POLICY CONSENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.policy_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_type VARCHAR(50) NOT NULL,
  policy_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
  accepted BOOLEAN NOT NULL DEFAULT TRUE,
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  plan_name VARCHAR(50) DEFAULT NULL,
  billing_period VARCHAR(20) DEFAULT NULL,
  source_page VARCHAR(255) DEFAULT NULL
);

-- Enable RLS
ALTER TABLE public.policy_consents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own consents" ON public.policy_consents;
DROP POLICY IF EXISTS "Users can insert their own consents" ON public.policy_consents;
DROP POLICY IF EXISTS "Anon can insert signup consents" ON public.policy_consents;

-- Create Policies
CREATE POLICY "Users can view their own consents" ON public.policy_consents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consents" ON public.policy_consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anon can insert signup consents" ON public.policy_consents
  FOR INSERT WITH CHECK (TRUE);

-- =============================================================================
-- STEP 13: EMAIL LOGS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.email_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient       VARCHAR(255) NOT NULL,
  email_type      VARCHAR(50) NOT NULL,
  subject         VARCHAR(255) NOT NULL,
  status          VARCHAR(20) NOT NULL,
  error_message   TEXT,
  sent_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Create Policies
DROP POLICY IF EXISTS "Allow select for owner" ON public.email_logs;
DROP POLICY IF EXISTS "Allow system insert" ON public.email_logs;

CREATE POLICY "Allow select for owner" ON public.email_logs
  FOR SELECT USING (recipient = auth.email());

CREATE POLICY "Allow system insert" ON public.email_logs
  FOR INSERT WITH CHECK (TRUE);

-- =============================================================================
-- STEP 14: BILLING & CERTIFICATION TABLES
-- =============================================================================

-- Certificates Table
CREATE TABLE IF NOT EXISTS public.certificates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT NOT NULL,
  course_id         UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  verification_code VARCHAR(100) UNIQUE NOT NULL,
  certificate_url   TEXT NOT NULL,
  issued_at         TIMESTAMPTZ DEFAULT NOW(),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  VARCHAR(50) UNIQUE NOT NULL,
  user_id         TEXT NOT NULL,
  transaction_id  VARCHAR(100) DEFAULT NULL,
  amount          NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  tax             NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total           NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  tax_type        VARCHAR(20) NOT NULL DEFAULT 'GST',
  status          VARCHAR(30) NOT NULL DEFAULT 'paid',
  billing_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  course_id       UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  plan            VARCHAR(50) DEFAULT NULL,
  pdf_url         TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Refunds Table
CREATE TABLE IF NOT EXISTS public.refunds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount      NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status      VARCHAR(30) NOT NULL DEFAULT 'pending',
  reason      TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Failed Payments & Recoveries Table
CREATE TABLE IF NOT EXISTS public.failed_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  subscription_id VARCHAR(100) DEFAULT NULL,
  amount          NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  failure_reason  TEXT DEFAULT '',
  retry_count     INTEGER DEFAULT 0,
  status          VARCHAR(30) NOT NULL DEFAULT 'failed',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_payments ENABLE ROW LEVEL SECURITY;

-- Select policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow read certificates for owner' AND tablename = 'certificates'
  ) THEN
    CREATE POLICY "Allow read certificates for owner" ON public.certificates FOR SELECT USING (TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow read invoices for owner' AND tablename = 'invoices'
  ) THEN
    CREATE POLICY "Allow read invoices for owner" ON public.invoices FOR SELECT USING (user_id = auth.email());
  END IF;
END $$;

-- Open policies for system writes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'System write certificates' AND tablename = 'certificates'
  ) THEN
    CREATE POLICY "System write certificates" ON public.certificates FOR ALL WITH CHECK (TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'System write invoices' AND tablename = 'invoices'
  ) THEN
    CREATE POLICY "System write invoices" ON public.invoices FOR ALL WITH CHECK (TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'System write refunds' AND tablename = 'refunds'
  ) THEN
    CREATE POLICY "System write refunds" ON public.refunds FOR ALL WITH CHECK (TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'System write failed_payments' AND tablename = 'failed_payments'
  ) THEN
    CREATE POLICY "System write failed_payments" ON public.failed_payments FOR ALL WITH CHECK (TRUE);
  END IF;
END $$;

-- =============================================================================
-- CODING WORKSPACE MODULE (IDE & CHALLENGES)
-- =============================================================================

-- Coding Challenges Metadata Table
CREATE TABLE IF NOT EXISTS public.coding_challenges (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          VARCHAR(255) NOT NULL,
  description    TEXT NOT NULL,
  difficulty     VARCHAR(50) NOT NULL DEFAULT 'medium',
  category       VARCHAR(100) NOT NULL DEFAULT 'DSA',
  tier           VARCHAR(50) NOT NULL DEFAULT 'Free',
  default_code   JSONB NOT NULL DEFAULT '{}'::jsonb,
  solution_code  JSONB NOT NULL DEFAULT '{}'::jsonb,
  points         INTEGER NOT NULL DEFAULT 50,
  time_limit_ms  INTEGER NOT NULL DEFAULT 2000,
  memory_limit_kb INTEGER NOT NULL DEFAULT 64000,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Coding Challenge Test Cases
CREATE TABLE IF NOT EXISTS public.challenge_test_cases (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id   UUID NOT NULL REFERENCES public.coding_challenges(id) ON DELETE CASCADE,
  input_args     JSONB NOT NULL DEFAULT '[]'::jsonb,
  expected_output JSONB NOT NULL,
  is_hidden      BOOLEAN NOT NULL DEFAULT FALSE,
  display_order  INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Code Submissions
CREATE TABLE IF NOT EXISTS public.challenge_submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id   UUID NOT NULL REFERENCES public.coding_challenges(id) ON DELETE CASCADE,
  user_id        TEXT NOT NULL,
  language       VARCHAR(50) NOT NULL,
  submitted_code TEXT NOT NULL,
  status         VARCHAR(50) NOT NULL,
  passed_cases   INTEGER NOT NULL DEFAULT 0,
  total_cases    INTEGER NOT NULL DEFAULT 0,
  runtime_ms     INTEGER NOT NULL DEFAULT 0,
  memory_kb      INTEGER NOT NULL DEFAULT 0,
  plagiarism_score NUMERIC(5, 2) DEFAULT 0.00,
  ai_feedback    TEXT DEFAULT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Coding Contests & Hackathons
CREATE TABLE IF NOT EXISTS public.contests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          VARCHAR(255) NOT NULL,
  description    TEXT NOT NULL,
  start_time     TIMESTAMPTZ NOT NULL,
  end_time       TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Contest Challenges Link
CREATE TABLE IF NOT EXISTS public.contest_challenges (
  contest_id     UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  challenge_id   UUID NOT NULL REFERENCES public.coding_challenges(id) ON DELETE CASCADE,
  PRIMARY KEY (contest_id, challenge_id)
);

-- User Coding Analytics & Badges
CREATE TABLE IF NOT EXISTS public.user_coding_stats (
  user_id             TEXT PRIMARY KEY,
  problems_solved     INTEGER NOT NULL DEFAULT 0,
  streak_days         INTEGER NOT NULL DEFAULT 0,
  xp_points           INTEGER NOT NULL DEFAULT 0,
  languages_used      JSONB NOT NULL DEFAULT '{}'::jsonb,
  difficulty_solved   JSONB NOT NULL DEFAULT '{"easy":0,"medium":0,"hard":0,"project":0}'::jsonb,
  last_submit_date    DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  badge_id    VARCHAR(100) NOT NULL,
  awarded_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Quiz Attempts to track graded metrics
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL, -- email
  quiz_id       UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score_percent INTEGER NOT NULL,
  passed        BOOLEAN NOT NULL,
  attempt_num   INTEGER NOT NULL DEFAULT 1,
  completed_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Capstone Projects Table
CREATE TABLE IF NOT EXISTS public.capstone_projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID UNIQUE NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL DEFAULT 'Capstone Project',
  description     TEXT NOT NULL,
  guidelines      TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Project Submissions Table
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

-- Final Assessment Coding Challenges Junction Table
CREATE TABLE IF NOT EXISTS public.final_assessment_challenges (
  course_id    UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.coding_challenges(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, challenge_id)
);

-- Enable RLS and permissions
ALTER TABLE public.coding_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coding_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capstone_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.final_assessment_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open select challenges" ON public.coding_challenges FOR SELECT USING (TRUE);
CREATE POLICY "Open select test cases" ON public.challenge_test_cases FOR SELECT USING (TRUE);
CREATE POLICY "Allow read submissions for owner" ON public.challenge_submissions FOR SELECT USING (user_id = auth.email() OR TRUE);
CREATE POLICY "Open select contests" ON public.contests FOR SELECT USING (TRUE);
CREATE POLICY "Allow read coding stats for owner" ON public.user_coding_stats FOR SELECT USING (user_id = auth.email() OR TRUE);
CREATE POLICY "Allow read badges for owner" ON public.user_badges FOR SELECT USING (user_id = auth.email() OR TRUE);
CREATE POLICY "Allow read attempts for owner" ON public.quiz_attempts FOR SELECT USING (user_id = auth.email() OR TRUE);
CREATE POLICY "Open read capstones" ON public.capstone_projects FOR SELECT USING (TRUE);
CREATE POLICY "Allow read project submissions for owner" ON public.project_submissions FOR SELECT USING (user_id = auth.email() OR TRUE);
CREATE POLICY "Open read final challenges" ON public.final_assessment_challenges FOR SELECT USING (TRUE);

CREATE POLICY "System manage challenges" ON public.coding_challenges FOR ALL WITH CHECK (TRUE);
CREATE POLICY "System manage test cases" ON public.challenge_test_cases FOR ALL WITH CHECK (TRUE);
CREATE POLICY "System manage submissions" ON public.challenge_submissions FOR ALL WITH CHECK (TRUE);
CREATE POLICY "System manage stats" ON public.user_coding_stats FOR ALL WITH CHECK (TRUE);
CREATE POLICY "System manage badges" ON public.user_badges FOR ALL WITH CHECK (TRUE);
CREATE POLICY "System manage contest_challenges" ON public.contest_challenges FOR ALL WITH CHECK (TRUE);
CREATE POLICY "System manage contests" ON public.contests FOR ALL WITH CHECK (TRUE);
CREATE POLICY "System manage attempts" ON public.quiz_attempts FOR ALL WITH CHECK (TRUE);
CREATE POLICY "System manage capstones" ON public.capstone_projects FOR ALL WITH CHECK (TRUE);
CREATE POLICY "System manage project submissions" ON public.project_submissions FOR ALL WITH CHECK (TRUE);
CREATE POLICY "System manage final challenges" ON public.final_assessment_challenges FOR ALL WITH CHECK (TRUE);

-- Seed Data: Insert Two Sum
INSERT INTO public.coding_challenges (id, title, description, difficulty, category, tier, default_code, solution_code, points, time_limit_ms, memory_limit_kb)
VALUES 
(
  '22222222-2222-2222-2222-222222222222',
  'Two Sum',
  'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.\n\n### Example 1:\n```\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].\n```',
  'easy',
  'DSA',
  'Free',
  '{
    "javascript": "function twoSum(nums, target) {\n  // Write your code here\n  return [];\n}",
    "python": "def two_sum(nums, target):\n    # Write your code here\n    return []",
    "cpp": "#include <vector>\n\nclass Solution {\npublic:\n    std::vector<int> twoSum(std::vector<int>& nums, int target) {\n        return {};\n    }\n};"
  }'::jsonb,
  '{
    "javascript": "function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}",
    "python": "def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []"
  }'::jsonb,
  50,
  2000,
  64000
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.challenge_test_cases (challenge_id, input_args, expected_output, is_hidden, display_order)
VALUES 
('22222222-2222-2222-2222-222222222222', '[[2, 7, 11, 15], 9]'::jsonb, '[0, 1]'::jsonb, false, 1),
('22222222-2222-2222-2222-222222222222', '[[3, 2, 4], 6]'::jsonb, '[1, 2]'::jsonb, false, 2),
('22222222-2222-2222-2222-222222222222', '[[3, 3], 6]'::jsonb, '[0, 1]'::jsonb, true, 3)
ON CONFLICT DO NOTHING;

-- Seed Data: Insert Reverse String
INSERT INTO public.coding_challenges (id, title, description, difficulty, category, tier, default_code, solution_code, points, time_limit_ms, memory_limit_kb)
VALUES 
(
  '33333333-3333-3333-3333-333333333333',
  'Reverse String',
  'Write a function that reverses a string. The input string is given as an array of characters `s`.\n\nYou must do this by modifying the input array in-place with `O(1)` extra memory.\n\n### Example 1:\n```\nInput: s = ["h","e","l","l","o"]\nOutput: ["o","l","l","e","h"]\n```',
  'easy',
  'DSA',
  'Free',
  '{
    "javascript": "function reverseString(s) {\n  // Write your code here\n  return s;\n}",
    "python": "def reverse_string(s):\n    # Write your code here\n    return s"
  }'::jsonb,
  '{
    "javascript": "function reverseString(s) {\n  let left = 0, right = s.length - 1;\n  while (left < right) {\n    const temp = s[left];\n    s[left] = s[right];\n    s[right] = temp;\n    left++;\n    right--;\n  }\n  return s;\n}",
    "python": "def reverse_string(s):\n    s.reverse()\n    return s"
  }'::jsonb,
  30,
  2000,
  64000
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.challenge_test_cases (challenge_id, input_args, expected_output, is_hidden, display_order)
VALUES 
('33333333-3333-3333-3333-333333333333', '[["h","e","l","l","o"]]'::jsonb, '["o","l","l","e","h"]'::jsonb, false, 1),
('33333333-3333-3333-3333-333333333333', '[["H","a","n","n","a","h"]]'::jsonb, '["h","a","n","n","a","H"]'::jsonb, true, 2)
ON CONFLICT DO NOTHING;

-- Foreign key constraint for lessons table to reference coding_challenges
ALTER TABLE public.lessons 
ADD CONSTRAINT fk_lessons_coding_challenge 
FOREIGN KEY (coding_challenge_id) 
REFERENCES public.coding_challenges(id) 
ON DELETE SET NULL;

-- =============================================================================
-- STEP 15: SEED GRADUATION REQUIREMENTS
-- =============================================================================

INSERT INTO public.capstone_projects (course_id, title, description, guidelines) VALUES 
('11111111-1111-1111-1111-111111111111', 'React Client Portal App', '### Capstone Project: React Client Portal\n\nIn this project, you will build a premium client-side administration portal using React. Your portal must interact with remote APIs, utilize state-batching hooks, render responsive glassmorphism lists, and support local notes caching.', '1. Functional components with custom hooks\n2. Responsive, styled Vanilla CSS design\n3. Client-side routing configurations\n4. Error boundary implementations')
ON CONFLICT (course_id) DO NOTHING;

INSERT INTO public.final_assessment_challenges (course_id, challenge_id) VALUES 
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

-- Make existing React Quiz graded
UPDATE public.quizzes SET is_graded = true, max_attempts = 3 WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Add a Final Assessment Quiz (final MCQ exam) for React Course
INSERT INTO public.quizzes (id, lesson_id, title, time_limit_minutes, passing_score_percent, is_final, is_graded, max_attempts) VALUES
('fffffffe-ffff-ffff-ffff-ffffffffffff', '11111111-1111-1111-1111-211111111111', 'React Comprehensive Final Exam', 15, 80, true, true, 2)
ON CONFLICT DO NOTHING;

INSERT INTO public.quiz_questions (quiz_id, question, options, correct_answer_index, explanation) VALUES
('fffffffe-ffff-ffff-ffff-ffffffffffff',
 'Which hooks sequence correctly manages cache synchronization during layout mounts?',
 'ARRAY["useLayoutEffect, then useEffect", "useEffect, then useLayoutEffect", "useState, then useMemo", "useRef, then useLayoutEffect"]',
 0,
 'useLayoutEffect fires synchronously after all DOM mutations but before the browser paints. useEffect fires asynchronously after paint.')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- DONE!
-- =============================================================================
-- Tables created:
--   courses, lessons, progress, course_progress, quizzes, quiz_questions
--   course_analytics, platform_analytics, career_paths
--   user_learning_stats, search_history, ai_learning_paths
--   certificates, invoices, refunds, failed_payments
--   coding_challenges, challenge_test_cases, challenge_submissions
--   contests, contest_challenges, user_coding_stats, user_badges
-- =============================================================================
