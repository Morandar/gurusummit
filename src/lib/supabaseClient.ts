import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 supabaseClient: Initializing Supabase client...');
console.log('🔧 supabaseClient: URL:', supabaseUrl ? 'SET' : 'MISSING');
console.log('🔧 supabaseClient: KEY:', supabaseAnonKey ? 'SET' : 'MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ supabaseClient: Missing Supabase environment variables!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
