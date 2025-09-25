import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

// Use service role key with PostgREST headers for maximum compatibility
export const supabase = createClient(url, serviceKey, {
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      'Accept-Profile': 'public',
      'Content-Profile': 'public',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    },
  },
});
