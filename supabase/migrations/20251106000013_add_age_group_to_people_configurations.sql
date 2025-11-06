-- Add age_group JSONB column to people_configurations
-- This stores configurable age ranges per organization for statistics and filtering

BEGIN;

-- Add column if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'people_configurations'
      AND column_name = 'age_group'
  ) THEN
    ALTER TABLE public.people_configurations
      ADD COLUMN age_group JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Initialize with default age groups where empty or null
UPDATE public.people_configurations
SET age_group = '[
  {"name": "Children", "min_age": 0, "max_age": 13},
  {"name": "Teens", "min_age": 14, "max_age": 19},
  {"name": "Young Adults", "min_age": 20, "max_age": 35},
  {"name": "Adults", "min_age": 36, "max_age": 49},
  {"name": "Mature", "min_age": 50, "max_age": 64},
  {"name": "Seniors", "min_age": 65, "max_age": 120}
]'
WHERE (age_group IS NULL) OR (age_group = '[]'::jsonb);

COMMIT;