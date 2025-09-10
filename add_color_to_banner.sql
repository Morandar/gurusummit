-- Migration: Add color column to banner table
-- Run this in Supabase SQL Editor

-- First, check if column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'banner'
        AND table_schema = 'public'
        AND column_name = 'color'
    ) THEN
        -- Add the color column
        ALTER TABLE public.banner
        ADD COLUMN color TEXT DEFAULT 'blue-purple';

        -- Add check constraint
        ALTER TABLE public.banner
        ADD CONSTRAINT banner_color_check
        CHECK (color IN ('blue-purple', 'green-teal', 'red-pink', 'yellow-orange', 'indigo-cyan'));

        RAISE NOTICE 'Color column added successfully';
    ELSE
        RAISE NOTICE 'Color column already exists';
    END IF;
END $$;

-- Update existing banners to have the default color
UPDATE public.banner
SET color = 'blue-purple'
WHERE color IS NULL OR color = '';

-- Verify the migration was successful
SELECT
    id,
    text,
    color,
    is_active,
    target_audience,
    created_at
FROM public.banner
ORDER BY created_at DESC;