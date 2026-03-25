CREATE TABLE IF NOT EXISTS public.attendance_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  branch_id uuid NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  radius integer NOT NULL,
  country text NULL,
  city text NULL,
  state_region text NULL,
  street text NULL,
  full_address text NULL,
  created_by uuid NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_updated_by uuid NULL,
  CONSTRAINT attendance_locations_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_locations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT attendance_locations_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE CASCADE,
  CONSTRAINT attendance_locations_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles (id) ON DELETE SET NULL,
  CONSTRAINT attendance_locations_last_updated_by_fkey FOREIGN KEY (last_updated_by) REFERENCES profiles (id) ON DELETE SET NULL,
  CONSTRAINT attendance_locations_lat_check CHECK (lat >= (-90)::double precision AND lat <= (90)::double precision),
  CONSTRAINT attendance_locations_lng_check CHECK (lng >= (-180)::double precision AND lng <= (180)::double precision),
  CONSTRAINT attendance_locations_radius_check CHECK (radius > 0 AND radius <= 100000)
);

CREATE UNIQUE INDEX IF NOT EXISTS attendance_locations_org_default_unique
  ON public.attendance_locations (organization_id)
  WHERE branch_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS attendance_locations_org_branch_unique
  ON public.attendance_locations (organization_id, branch_id)
  WHERE branch_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_locations_organization_id
  ON public.attendance_locations (organization_id);

CREATE INDEX IF NOT EXISTS idx_attendance_locations_branch_id
  ON public.attendance_locations (branch_id);

ALTER TABLE public.attendance_sessions
  ADD COLUMN IF NOT EXISTS location_id uuid NULL;

ALTER TABLE public.attendance_sessions
  DROP CONSTRAINT IF EXISTS attendance_sessions_location_id_fkey;

ALTER TABLE public.attendance_sessions
  ADD CONSTRAINT attendance_sessions_location_id_fkey
  FOREIGN KEY (location_id) REFERENCES public.attendance_locations (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_location_id
  ON public.attendance_sessions (location_id);

ALTER TABLE public.attendance_sessions
  DROP CONSTRAINT IF EXISTS attendance_sessions_valid_location;

ALTER TABLE public.attendance_sessions
  ADD CONSTRAINT attendance_sessions_valid_location CHECK (
    location IS NULL OR (
      location ? 'lat' AND
      location ? 'lng' AND
      (location->>'lat')::numeric BETWEEN -90 AND 90 AND
      (location->>'lng')::numeric BETWEEN -180 AND 180 AND
      (location ? 'radius' IS FALSE OR (location->>'radius')::numeric > 0)
    )
  );

ALTER TABLE public.attendance_sessions
  DROP CONSTRAINT IF EXISTS attendance_sessions_location_source_check;

ALTER TABLE public.attendance_sessions
  ADD CONSTRAINT attendance_sessions_location_source_check CHECK (
    location_id IS NULL OR location IS NULL
  );
