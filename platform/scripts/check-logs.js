import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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

if (typeof global !== 'undefined' && !global.WebSocket) {
  global.WebSocket = class {};
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: logs, error } = await supabase
    .from('email_logs')
    .select('*')
    .order('sent_at', { ascending: false });

  if (error) {
    console.error('Error fetching logs:', error.message);
  } else {
    console.log(`Successfully retrieved ${logs.length} email logs:`);
    console.log(JSON.stringify(logs, null, 2));
  }
}

run();
