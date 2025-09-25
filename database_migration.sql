-- O2 Guru Summit 2025 Database Migration
-- This script creates all necessary tables for the application

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    personalnumber TEXT NOT NULL UNIQUE,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    position TEXT NOT NULL,
    profileimage TEXT,
    password_hash TEXT,
    visits INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0,
    visitedbooths INTEGER[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Booths table
CREATE TABLE IF NOT EXISTS public.booths (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    login TEXT NOT NULL,
    password TEXT,
    logo TEXT,
    category TEXT,
    visits INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Program table
CREATE TABLE IF NOT EXISTS public.program (
    id INTEGER PRIMARY KEY,
    time TEXT NOT NULL,
    event TEXT NOT NULL,
    duration INTEGER NOT NULL DEFAULT 30,
    category TEXT DEFAULT 'lecture',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Visits table
CREATE TABLE IF NOT EXISTS public.visits (
    id BIGSERIAL PRIMARY KEY,
    attendee_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    booth_id BIGINT REFERENCES public.booths(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(attendee_id, booth_id)
);

-- Winners table
CREATE TABLE IF NOT EXISTS public.winners (
    id BIGINT PRIMARY KEY,
    userid BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    personalnumber TEXT NOT NULL,
    position TEXT NOT NULL,
    wonat TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'participants', 'booth_staff')),
    created_by TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Banner table
CREATE TABLE IF NOT EXISTS public.banner (
    id BIGSERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'participants', 'booth_staff')),
    color TEXT DEFAULT 'blue-purple' CHECK (color IN ('blue-purple', 'green-teal', 'red-pink', 'yellow-orange', 'indigo-cyan')),
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Discounted phones table
CREATE TABLE IF NOT EXISTS public.discounted_phones (
    id BIGSERIAL PRIMARY KEY,
    manufacturer_name TEXT NOT NULL,
    phone_model TEXT NOT NULL,
    manufacturer_logo TEXT,
    phone_image TEXT,
    original_price DECIMAL(10,2) NOT NULL,
    discounted_price DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Settings table for storing application settings
CREATE TABLE IF NOT EXISTS public.settings (
    id BIGSERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_personalnumber ON public.users(personalnumber);
CREATE INDEX IF NOT EXISTS idx_booths_code ON public.booths(code);
CREATE INDEX IF NOT EXISTS idx_visits_attendee_id ON public.visits(attendee_id);
CREATE INDEX IF NOT EXISTS idx_visits_booth_id ON public.visits(booth_id);
CREATE INDEX IF NOT EXISTS idx_banner_is_active ON public.banner(is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_winners_wonat ON public.winners(wonat DESC);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounted_phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is an event app)
-- Users table policies
CREATE POLICY "Allow all operations on users" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- Booths table policies
CREATE POLICY "Allow all operations on booths" ON public.booths FOR ALL USING (true) WITH CHECK (true);

-- Program table policies
CREATE POLICY "Allow all operations on program" ON public.program FOR ALL USING (true) WITH CHECK (true);

-- Visits table policies
CREATE POLICY "Allow all operations on visits" ON public.visits FOR ALL USING (true) WITH CHECK (true);

-- Winners table policies
CREATE POLICY "Allow all operations on winners" ON public.winners FOR ALL USING (true) WITH CHECK (true);

-- Notifications table policies
CREATE POLICY "Allow all operations on notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- Banner table policies
CREATE POLICY "Allow all operations on banner" ON public.banner FOR ALL USING (true) WITH CHECK (true);

-- Discounted phones table policies
CREATE POLICY "Allow all operations on discounted_phones" ON public.discounted_phones FOR ALL USING (true) WITH CHECK (true);

-- Settings table policies
CREATE POLICY "Allow all operations on settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

-- Insert default settings if they don't exist
INSERT INTO public.settings (key, value) VALUES
    ('codeTimeSettings', '{"startTime": "09:00", "endTime": "17:00", "enabled": false}'),
    ('homePageTexts', '{
        "title": "O2 Guru Summit 2025",
        "subtitle": "Nejdůležitější technologický event roku",
        "description": "Sbírejte body návštěvou stánků a získejte hodnotné ceny",
        "loginTitle": "Přihlaste se do aplikace",
        "loginDescription": "Získejte přístup k interaktivní mapě stánků, sledujte svůj pokrok a nezmeškejte žádnou část programu.",
        "benefitsTitle": "🎯 Co vás čeká?",
        "benefits": [
            "17 interaktivních stánků s nejnovějšími technologiemi",
            "Sběr bodů za návštěvy stánků",
            "Živý program s časovačem",
            "Hodnotné ceny pro nejaktivnější účastníky"
        ],
        "prizesTitle": "🏆 Soutěžte o ceny",
        "prizesDescription": "Navštivte všechny stánky a získejte šanci vyhrát nejnovější technologie a exkluzivní O2 produkty."
    }')
ON CONFLICT (key) DO NOTHING;

-- Insert some sample data for testing (optional)
-- You can remove these INSERT statements if you don't want sample data

-- Sample booths
INSERT INTO public.booths (name, code, login, password, category) VALUES
    ('O2 Telekomunikace', 'O2TEL', 'admin', 'password123', 'telecom'),
    ('O2 Mobilní sítě', 'O2NET', 'admin', 'password123', 'network'),
    ('O2 Internet', 'O2INT', 'admin', 'password123', 'internet'),
    ('O2 TV', 'O2TV', 'admin', 'password123', 'entertainment')
ON CONFLICT (code) DO NOTHING;

-- Sample program
INSERT INTO public.program (id, time, event, duration, category) VALUES
    (1, '09:00', 'Registrace účastníků', 60, 'ceremony'),
    (2, '10:00', 'Úvodní přednáška', 45, 'lecture'),
    (3, '10:45', 'Přestávka na kávu', 15, 'break'),
    (4, '11:00', 'Workshop: Budoucnost telekomunikací', 60, 'workshop')
ON CONFLICT (id) DO NOTHING;

-- Sample notifications
INSERT INTO public.notifications (title, message, target_audience, created_by) VALUES
    ('Vítejte na O2 Guru Summitu!', 'Začínáme registrací účastníků. Najděte svůj stánek a začněte sbírat body!', 'all', 'admin'),
    ('Připomínka: Registrace končí v 9:00', 'Ujistěte se, že jste registrovaní před začátkem programu.', 'participants', 'admin');

COMMIT;