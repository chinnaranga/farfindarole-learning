-- STEP 12: CREATE POLICY CONSENTS TABLE
CREATE TABLE IF NOT EXISTS public.policy_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_type VARCHAR(50) NOT NULL, -- 'signup_terms', 'signup_privacy', 'pricing', 'subscription', 'course', 'general_terms', 'general_privacy'
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

-- Also allow inserts if user is not authenticated yet during signup, checking that the user_id corresponds to a valid target if needed
CREATE POLICY "Anon can insert signup consents" ON public.policy_consents
  FOR INSERT WITH CHECK (TRUE);
