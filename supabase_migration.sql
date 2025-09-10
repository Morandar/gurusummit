-- Supabase Migration: Add color column to banner table
-- Copy and paste this into Supabase SQL Editor and run it

-- Add color column to banner table
ALTER TABLE public.banner
ADD COLUMN color TEXT DEFAULT 'blue-purple';

-- Add check constraint for valid color values
ALTER TABLE public.banner
ADD CONSTRAINT banner_color_check
CHECK (color IN ('blue-purple', 'green-teal', 'red-pink', 'yellow-orange', 'indigo-cyan'));

-- Update existing records to have default color
UPDATE public.banner
SET color = 'blue-purple'
WHERE color IS NULL;

-- Verify the migration
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'banner' AND table_schema = 'public'
ORDER BY ordinal_position;