import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasValidSupabaseConfig =
  typeof supabaseUrl === 'string' &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id') &&
  typeof supabaseAnonKey === 'string' &&
  supabaseAnonKey.length > 0 &&
  !supabaseAnonKey.includes('your-actual-anon-key');

if (!hasValidSupabaseConfig) {
  throw new Error(
    'Invalid Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env, then restart Vite.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);