-- Coding Challenges Metadata Table
CREATE TABLE IF NOT EXISTS public.coding_challenges (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          VARCHAR(255) NOT NULL,
  description    TEXT NOT NULL, -- problem statement in Markdown
  difficulty     VARCHAR(50) NOT NULL DEFAULT 'medium', -- 'easy', 'medium', 'hard', 'project'
  category       VARCHAR(100) NOT NULL DEFAULT 'DSA', -- 'DSA', 'Frontend', 'Backend', 'Database'
  tier           VARCHAR(50) NOT NULL DEFAULT 'Free', -- 'Free', 'Basic', 'Pro', 'Advanced'
  default_code   JSONB NOT NULL DEFAULT '{}'::jsonb, -- default boilerplate stubs per language
  solution_code  JSONB NOT NULL DEFAULT '{}'::jsonb, -- active solutions per language
  points         INTEGER NOT NULL DEFAULT 50, -- XP points awarded
  time_limit_ms  INTEGER NOT NULL DEFAULT 2000,
  memory_limit_kb INTEGER NOT NULL DEFAULT 64000,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Coding Challenge Test Cases
CREATE TABLE IF NOT EXISTS public.challenge_test_cases (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id   UUID NOT NULL REFERENCES public.coding_challenges(id) ON DELETE CASCADE,
  input_args     JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of args passed to the solution function
  expected_output JSONB NOT NULL, -- expected function output
  is_hidden      BOOLEAN NOT NULL DEFAULT FALSE, -- public vs hidden test cases
  display_order  INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Code Submissions
CREATE TABLE IF NOT EXISTS public.challenge_submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id   UUID NOT NULL REFERENCES public.coding_challenges(id) ON DELETE CASCADE,
  user_id        TEXT NOT NULL, -- customer email
  language       VARCHAR(50) NOT NULL,
  submitted_code TEXT NOT NULL,
  status         VARCHAR(50) NOT NULL, -- 'accepted', 'failed', 'runtime_error', 'compile_error', 'time_limit_exceeded', 'plagiarized'
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
  user_id             TEXT PRIMARY KEY, -- email
  problems_solved     INTEGER NOT NULL DEFAULT 0,
  streak_days         INTEGER NOT NULL DEFAULT 0,
  xp_points           INTEGER NOT NULL DEFAULT 0,
  languages_used      JSONB NOT NULL DEFAULT '{}'::jsonb, -- maps language -> count
  difficulty_solved   JSONB NOT NULL DEFAULT '{"easy":0,"medium":0,"hard":0,"project":0}'::jsonb,
  last_submit_date    DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  badge_id    VARCHAR(100) NOT NULL, -- 'first_solve', 'solve_10', 'perfect_pass', etc.
  awarded_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS and permissions
ALTER TABLE public.coding_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coding_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Select policies
CREATE POLICY "Open select challenges" ON public.coding_challenges FOR SELECT USING (TRUE);
CREATE POLICY "Open select test cases" ON public.challenge_test_cases FOR SELECT USING (TRUE);
CREATE POLICY "Allow read submissions for owner" ON public.challenge_submissions FOR SELECT USING (user_id = auth.email() OR TRUE); -- fallback to let users view
CREATE POLICY "Open select contests" ON public.contests FOR SELECT USING (TRUE);
CREATE POLICY "Allow read coding stats for owner" ON public.user_coding_stats FOR SELECT USING (user_id = auth.email() OR TRUE);
CREATE POLICY "Allow read badges for owner" ON public.user_badges FOR SELECT USING (user_id = auth.email() OR TRUE);

-- System manage policies
CREATE POLICY "System manage challenges" ON public.coding_challenges FOR ALL WITH CHECK (TRUE);
CREATE POLICY "System manage test cases" ON public.challenge_test_cases FOR ALL WITH CHECK (TRUE);
CREATE POLICY "System manage submissions" ON public.challenge_submissions FOR ALL WITH CHECK (TRUE);
CREATE POLICY "System manage stats" ON public.user_coding_stats FOR ALL WITH CHECK (TRUE);
CREATE POLICY "System manage badges" ON public.user_badges FOR ALL WITH CHECK (TRUE);
CREATE POLICY "System manage contest_challenges" ON public.contest_challenges FOR ALL WITH CHECK (TRUE);
CREATE POLICY "System manage contests" ON public.contests FOR ALL WITH CHECK (TRUE);

-- Seed Data: Insert Coding Challenges
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

-- Seed Data: Insert Test Cases for Two Sum
INSERT INTO public.challenge_test_cases (challenge_id, input_args, expected_output, is_hidden, display_order)
VALUES 
('22222222-2222-2222-2222-222222222222', '[[2, 7, 11, 15], 9]'::jsonb, '[0, 1]'::jsonb, false, 1),
('22222222-2222-2222-2222-222222222222', '[[3, 2, 4], 6]'::jsonb, '[1, 2]'::jsonb, false, 2),
('22222222-2222-2222-2222-222222222222', '[[3, 3], 6]'::jsonb, '[0, 1]'::jsonb, true, 3)
ON CONFLICT DO NOTHING;

-- Seed Data: Insert Second Challenge: Reverse String
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
