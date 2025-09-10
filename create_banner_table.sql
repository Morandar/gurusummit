-- Create banner table to replace notifications
CREATE TABLE IF NOT EXISTS public.banner (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'participants', 'booth_staff')),
    color TEXT DEFAULT 'blue-purple' CHECK (color IN ('blue-purple', 'green-teal', 'red-pink', 'yellow-orange', 'indigo-cyan')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT DEFAULT 'admin'
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.banner ENABLE ROW LEVEL SECURITY;

-- Create policy for all users to read banner (since it's public information)
CREATE POLICY "Allow all users to read banner" ON public.banner
    FOR SELECT USING (true);

-- Create policy for authenticated users to manage banner
CREATE POLICY "Allow authenticated users to manage banner" ON public.banner
    FOR ALL USING (auth.jwt() IS NOT NULL);

-- Optional: Drop notifications table if it exists
-- DROP TABLE IF EXISTS public.notifications CASCADE;

-- Insert a default banner (optional)
INSERT INTO public.banner (text, is_active, target_audience, created_by)
VALUES ('Vítejte na O2 Guru Summitu 2025!', false, 'all', 'admin')
ON CONFLICT DO NOTHING;