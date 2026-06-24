const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manually parse .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      process.env[key] = val;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.');
  process.exit(1);
}

if (typeof global !== 'undefined' && !global.WebSocket) {
  global.WebSocket = class {};
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // 1. Get first course
  const { data: courses } = await supabase.from('courses').select('id, title').limit(1);
  if (!courses || courses.length === 0) {
    console.error("No courses found.");
    return;
  }
  const course = courses[0];
  console.log(`Using course: ${course.title} (${course.id})`);

  // 2. Get first lesson of that course
  const { data: lessons } = await supabase.from('lessons').select('id, title').eq('course_id', course.id).limit(1);
  if (!lessons || lessons.length === 0) {
    console.error(`No lessons found for course ${course.id}.`);
    return;
  }
  const lesson = lessons[0];
  console.log(`Using lesson: ${lesson.title} (${lesson.id})`);

  const userId = 'rchinnarangaswamyreddyr@gmail.com'; // Use verified email
  console.log(`Triggering lesson update on localhost:3000...`);

  // 3. Clear progress for this user & lesson first so it's treated as the first lesson completion
  await supabase.from('progress').delete().eq('user_id', userId);
  await supabase.from('email_logs').delete().eq('recipient', userId);

  // 4. Send POST request
  try {
    const res = await fetch('http://localhost:3000/api/course-progress/update-lesson', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({
        userId: userId,
        lessonId: lesson.id,
        completed: true
      })
    });

    const body = await res.json();
    console.log(`Response status: ${res.status}`);
    console.log(`Response body:`, body);

    // 5. Query email logs to verify they were written
    setTimeout(async () => {
      const { data: logs } = await supabase.from('email_logs').select('*').eq('recipient', userId);
      console.log(`Email logs for ${userId}:`, logs);
    }, 2000);

  } catch (err) {
    console.error("Fetch request failed:", err);
  }
}

run();
