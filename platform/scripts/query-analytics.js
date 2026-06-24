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

if (typeof global !== 'undefined' && !global.WebSocket) {
  global.WebSocket = class {};
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: analytics, error: aError } = await supabase.from('platform_analytics').select('*');
  console.log('PLATFORM ANALYTICS:', { analytics, aError });

  const { count, error: pError } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  console.log('PROFILES COUNT:', { count, pError });

  const { data: profiles, error: pDataError } = await supabase.from('profiles').select('*');
  console.log('PROFILES DATA:', { profiles, pDataError });
}
run();
