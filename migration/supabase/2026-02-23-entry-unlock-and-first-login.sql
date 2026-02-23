-- Adds support for:
-- 1) tracking first participant login
-- 2) marking entry booth that unlocks other booths

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.booths
  ADD COLUMN IF NOT EXISTS is_unlock_booth BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.program
  ADD COLUMN IF NOT EXISTS image TEXT;

-- Optional helper index for filtering entry booth(s)
CREATE INDEX IF NOT EXISTS idx_booths_is_unlock_booth ON public.booths(is_unlock_booth);
