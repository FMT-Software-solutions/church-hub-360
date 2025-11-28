-- Add metadata column to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS metadata TEXT;

-- Comment on column
COMMENT ON COLUMN public.notifications.metadata IS 'JSON stringified metadata for the notification';
