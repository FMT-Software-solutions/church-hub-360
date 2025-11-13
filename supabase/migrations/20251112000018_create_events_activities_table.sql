-- Create events_activities table and policies
-- Manages church events, activities, and announcements with soft delete and org-scoped RLS

-- Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- Events & Activities table
CREATE TABLE IF NOT EXISTS public.events_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('event','activity','announcement')) NOT NULL DEFAULT 'event',
  category TEXT,

  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  all_day BOOLEAN NOT NULL DEFAULT FALSE,
  location TEXT,

  -- Reminder metadata (optional)
  remind_at TIMESTAMPTZ,
  remind_method TEXT CHECK (remind_method IN ('none','email','push','sms')) NOT NULL DEFAULT 'none',

  -- Status & soft delete
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

  -- Audit
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes for common filters
CREATE INDEX IF NOT EXISTS idx_events_org ON public.events_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_branch ON public.events_activities(branch_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events_activities(type);
CREATE INDEX IF NOT EXISTS idx_events_start ON public.events_activities(start_time);
CREATE INDEX IF NOT EXISTS idx_events_end ON public.events_activities(end_time);
CREATE INDEX IF NOT EXISTS idx_events_active ON public.events_activities(is_active);
CREATE INDEX IF NOT EXISTS idx_events_not_deleted ON public.events_activities(is_deleted);

-- Update trigger
CREATE OR REPLACE TRIGGER update_events_activities_updated_at
BEFORE UPDATE ON public.events_activities
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.events_activities ENABLE ROW LEVEL SECURITY;

-- Policies: organization-scoped, creator-restricted modifications
CREATE POLICY events_select_org
  ON public.events_activities FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    ) AND is_deleted = false
  );

CREATE POLICY events_insert_org
  ON public.events_activities FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    ) AND created_by = auth.uid()
  );

CREATE POLICY events_update_creator
  ON public.events_activities FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    ) AND created_by = auth.uid()
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    ) AND created_by = auth.uid()
  );

CREATE POLICY events_soft_delete_creator
  ON public.events_activities FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    ) AND created_by = auth.uid()
  );

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events_activities TO authenticated;

