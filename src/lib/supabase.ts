import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

// Use service role key to bypass RLS completely for better performance
export const supabase = createClient(url, serviceKey);
