import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    console.log('Connecting to Supabase...');
    
    // 1. Fetch all courses
    const { data: courses, error: coursesErr } = await supabase
      .from('courses')
      .select('id, title, tier');
    
    if (coursesErr) throw coursesErr;
    console.log('\n--- Courses in Database ---');
    console.log(courses);

    // 2. Fetch all certificates
    const { data: certs, error: certsErr } = await supabase
      .from('certificates')
      .select('id, user_id, course_id, verification_code');
    
    if (certsErr) throw certsErr;
    console.log('\n--- Certificates in Database ---');
    console.log(certs);

    // 3. Fetch lessons count for course '11111111-1111-1111-1111-111111111111'
    const { data: lessons, error: lessonsErr } = await supabase
      .from('lessons')
      .select('id, title')
      .eq('course_id', '11111111-1111-1111-1111-111111111111');
      
    if (lessonsErr) {
      console.log('\nError fetching lessons for mock course:', lessonsErr.message);
    } else {
      console.log(`\n--- Lessons for Course '11111111-1111-1111-1111-111111111111' (Count: ${lessons.length}) ---`);
      console.log(lessons);
    }

  } catch (err) {
    console.error('Error querying database:', err);
  }
}

check();
