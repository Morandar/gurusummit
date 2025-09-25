import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

// Use service role key with permissive RLS policies for PostgREST compatibility
export const supabase = createClient(url, serviceKey);
