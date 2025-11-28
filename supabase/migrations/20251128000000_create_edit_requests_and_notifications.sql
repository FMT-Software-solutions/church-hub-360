-- Create edit_requests table
CREATE TABLE IF NOT EXISTS public.edit_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Target Record
    table_name TEXT NOT NULL CHECK (table_name IN ('income', 'expense', 'pledge_payment')),
    record_id UUID NOT NULL, 
    
    -- Request Details
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Foreign key to profiles for easier joins
    CONSTRAINT fk_edit_requests_requester_profile FOREIGN KEY (requester_id) REFERENCES public.profiles(id),

    reason TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'expired')) DEFAULT 'pending',
    
    -- Approval Details
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewer_note TEXT,
    reviewed_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Create generic notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    type TEXT NOT NULL, 
    title TEXT NOT NULL,
    message TEXT,
    
    -- Link to the source
    resource_type TEXT, 
    resource_id UUID, 
    
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes
-- Concurrency Control: Only one active request per record
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_request_per_record ON public.edit_requests(table_name, record_id) 
WHERE status IN ('pending', 'approved');

CREATE INDEX IF NOT EXISTS idx_edit_requests_lookup ON public.edit_requests(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_edit_requests_status ON public.edit_requests(status);
CREATE INDEX IF NOT EXISTS idx_edit_requests_requester ON public.edit_requests(requester_id);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(recipient_id) WHERE is_read = FALSE;

-- RLS
ALTER TABLE public.edit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Simple policies for now as requested (application logic handles security)
CREATE POLICY "Enable all access for authenticated users" ON public.edit_requests
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users" ON public.notifications
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
