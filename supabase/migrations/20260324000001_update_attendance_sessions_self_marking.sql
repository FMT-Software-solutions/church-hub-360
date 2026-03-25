-- Migration to update attendance_sessions settings
-- Removes allow_public_marking and proximity_required
-- Adds allow_self_marking (boolean)

-- First add the new column with default value true
ALTER TABLE public.attendance_sessions
  ADD COLUMN IF NOT EXISTS allow_self_marking boolean DEFAULT true NOT NULL;

-- If you want to migrate existing data (optional based on old logic, but requested default is true)
-- UPDATE public.attendance_sessions SET allow_self_marking = allow_public_marking;

-- Remove old columns
ALTER TABLE public.attendance_sessions
  DROP COLUMN IF EXISTS allow_public_marking,
  DROP COLUMN IF EXISTS proximity_required;

-- Update table comments
COMMENT ON COLUMN attendance_sessions.allow_self_marking IS 'Whether members can self-mark attendance via personal links or QR codes';