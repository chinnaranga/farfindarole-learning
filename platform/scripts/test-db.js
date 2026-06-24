import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manually parse .env.local
const __filename = new URL(import.meta.url).pathname;
const __dirname = __filename.substring(0, __filename.lastIndexOf('/'));
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

console.log('Testing connection to Supabase:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const tables = [
    'courses', 
    'lessons', 
    'progress', 
    'quizzes', 
    'quiz_questions', 
    'email_logs',
    'invoices',
    'certificates',
    'refunds',
    'failed_payments'
  ];
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.error(`❌ Table "${table}" error:`, error.message);
      } else {
        console.log(`✅ Table "${table}" connection success. Sample data length:`, data.length);
      }
    } catch (e) {
      console.error(`❌ Table "${table}" fetch execution failed:`, e);
    }
  }
}

checkTables();
