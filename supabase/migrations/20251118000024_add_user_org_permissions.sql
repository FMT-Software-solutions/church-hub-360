ALTER TABLE public.user_organizations
  ADD COLUMN IF NOT EXISTS visibility_overrides jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.user_organizations
  ADD COLUMN IF NOT EXISTS can_create_users boolean DEFAULT true;