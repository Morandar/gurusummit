-- Add color column to existing banner table
ALTER TABLE public.banner ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'blue-purple' CHECK (color IN ('blue-purple', 'green-teal', 'red-pink', 'yellow-orange', 'indigo-cyan'));

-- Update existing banners to have a default color if they don't have one
UPDATE public.banner SET color = 'blue-purple' WHERE color IS NULL;