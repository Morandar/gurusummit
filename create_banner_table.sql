-- Create banner table to replace notifications
CREATE TABLE IF NOT EXISTS public.banner (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT DEFAULT 'admin'
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.banner ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read banner
CREATE POLICY "Allow authenticated users to read banner" ON public.banner
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for authenticated users to insert/update banner
CREATE POLICY "Allow authenticated users to manage banner" ON public.banner
    FOR ALL USING (auth.role() = 'authenticated');

-- Optional: Drop notifications table if it exists
-- DROP TABLE IF EXISTS public.notifications CASCADE;

-- Insert a default banner (optional)
INSERT INTO public.banner (text, is_active, created_by)
VALUES ('Vítejte na O2 Guru Summitu 2025!', true, 'admin')
ON CONFLICT DO NOTHING;