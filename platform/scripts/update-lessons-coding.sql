-- Add coding_challenge_id column to lessons table
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS coding_challenge_id UUID REFERENCES public.coding_challenges(id) ON DELETE SET NULL;

-- Link existing seed lessons or create new ones for coding practice
-- Let's check the first course in the database and add a coding practice lesson to it
DO $$
DECLARE
  v_course_id UUID;
BEGIN
  -- Select the first course
  SELECT id INTO v_course_id FROM public.courses LIMIT 1;
  
  IF v_course_id IS NOT NULL THEN
    -- Insert a new coding practice lesson
    INSERT INTO public.lessons (
      course_id,
      title,
      content,
      duration_minutes,
      order_num,
      free_preview,
      coding_challenge_id
    )
    VALUES (
      v_course_id,
      'Practice Coding: Two Sum Challenge',
      '### Coding Assignment\n\nIn this practice exercise, you will implement the classic **Two Sum** algorithm.\n\nUse the Monaco IDE workspace on the right side of this lesson player to write and run your JavaScript or Python code. Test cases are executed securely and your score is automatically calculated upon submission.',
      20,
      3, -- Order number 3
      true,
      '22222222-2222-2222-2222-222222222222' -- Two Sum challenge ID
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
