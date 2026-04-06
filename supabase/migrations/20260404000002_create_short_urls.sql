-- Migration to add a custom URL Shortener module

CREATE TABLE IF NOT EXISTS public.short_urls (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    code text NOT NULL UNIQUE,
    long_url text NOT NULL,
    created_at timestamptz DEFAULT now(),
    clicks integer DEFAULT 0
);

-- Create an index on the code for fast lookups
CREATE INDEX IF NOT EXISTS idx_short_urls_code ON public.short_urls(code);

-- Enable Row Level Security
ALTER TABLE public.short_urls ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can read short URLs (Needed for the redirect to work for anyone)
CREATE POLICY "Anyone can resolve short URLs" 
ON public.short_urls FOR SELECT 
USING (true);

-- 2. Authenticated users can create short URLs
CREATE POLICY "Authenticated users can create short URLs" 
ON public.short_urls FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 3. Users can only see their own organization's URLs in the dashboard
CREATE POLICY "Users can view their organization's short URLs" 
ON public.short_urls FOR SELECT 
TO authenticated 
USING (
  organization_id IN (
    SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
  )
);

-- RPC Function to safely resolve a URL and increment its click count atomically
CREATE OR REPLACE FUNCTION resolve_short_url(p_code text)
RETURNS text AS $$
DECLARE
    v_long_url text;
BEGIN
    UPDATE public.short_urls
    SET clicks = clicks + 1
    WHERE code = p_code
    RETURNING long_url INTO v_long_url;
    
    RETURN v_long_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
