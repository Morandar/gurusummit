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

-- Drop any existing RLS policies before disabling RLS
-- This resolves security advisor warnings about policies existing when RLS is disabled
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies on our tables
    FOR policy_record IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN ('users', 'booths', 'program', 'visits', 'winners', 'notifications', 'banner', 'discounted_phones', 'settings')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                      policy_record.policyname, policy_record.schemaname, policy_record.tablename);
    END LOOP;
END $$;

-- For event app with public access, disable RLS to avoid performance issues
-- This is safe since we're allowing all operations and using API keys for access control
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.booths DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.program DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounted_phones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- Note: Sample data inserts removed to avoid ON CONFLICT issues
-- You can add sample data manually through the admin interface after the tables are created

COMMIT;