-- Migrate announcements and slides for rich text editor usage

ALTER TABLE public.announcements
  RENAME COLUMN details TO description;

ALTER TABLE public.announcement_slides
  ADD COLUMN content_html TEXT,
  ADD COLUMN layout TEXT DEFAULT 'title_content';

UPDATE public.announcement_slides SET content_html = body WHERE content_html IS NULL;

ALTER TABLE public.announcement_slides
  DROP COLUMN body,
  DROP COLUMN media_url;

CREATE INDEX IF NOT EXISTS idx_announcement_slides_layout ON public.announcement_slides(layout);