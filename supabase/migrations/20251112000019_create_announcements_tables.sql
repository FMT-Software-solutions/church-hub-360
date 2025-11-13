-- Create announcements and announcement_slides tables with RLS and indexes

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 100),
  details TEXT NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_announcements_org ON public.announcements(organization_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at);

CREATE OR REPLACE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY announcements_select_org
  ON public.announcements FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    ) AND is_deleted = false
  );

CREATE POLICY announcements_insert_org
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    ) AND created_by = auth.uid()
  );

CREATE POLICY announcements_update_creator
  ON public.announcements FOR UPDATE
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

CREATE POLICY announcements_soft_delete_creator
  ON public.announcements FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    ) AND created_by = auth.uid()
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;

-- Announcement Slides
CREATE TABLE IF NOT EXISTS public.announcement_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 1),
  title TEXT,
  body TEXT,
  media_url TEXT,
  template_variant TEXT,
  bg_color TEXT,
  fg_color TEXT,
  font_size INTEGER CHECK (font_size IS NULL OR font_size >= 24),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_slide_position_per_announcement
ON public.announcement_slides(announcement_id, position);

CREATE INDEX IF NOT EXISTS idx_slides_announcement ON public.announcement_slides(announcement_id);
CREATE INDEX IF NOT EXISTS idx_slides_created_at ON public.announcement_slides(created_at);

CREATE OR REPLACE TRIGGER update_announcement_slides_updated_at
BEFORE UPDATE ON public.announcement_slides
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.announcement_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY slides_select_via_announcement
  ON public.announcement_slides FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = announcement_id
        AND a.organization_id IN (
          SELECT organization_id FROM public.user_organizations
          WHERE user_id = auth.uid() AND is_active = true
        )
        AND a.is_deleted = false
    )
  );

CREATE POLICY slides_insert_via_announcement
  ON public.announcement_slides FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = announcement_id
        AND a.organization_id IN (
          SELECT organization_id FROM public.user_organizations
          WHERE user_id = auth.uid() AND is_active = true
        )
    ) AND created_by = auth.uid()
  );

CREATE POLICY slides_update_creator_via_announcement
  ON public.announcement_slides FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = announcement_id
        AND a.organization_id IN (
          SELECT organization_id FROM public.user_organizations
          WHERE user_id = auth.uid() AND is_active = true
        )
    ) AND created_by = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = announcement_id
        AND a.organization_id IN (
          SELECT organization_id FROM public.user_organizations
          WHERE user_id = auth.uid() AND is_active = true
        )
    ) AND created_by = auth.uid()
  );

CREATE POLICY slides_delete_creator_via_announcement
  ON public.announcement_slides FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = announcement_id
        AND a.organization_id IN (
          SELECT organization_id FROM public.user_organizations
          WHERE user_id = auth.uid() AND is_active = true
        )
    ) AND created_by = auth.uid()
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcement_slides TO authenticated;

