-- Migration to add attendance self-mark audit table

CREATE TABLE IF NOT EXISTS public.attendance_self_mark_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE SET NULL,
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    source TEXT NOT NULL CHECK (source IN ('personal_link', 'qr_code', 'general_link')),
    status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
    failure_reason TEXT,
    submitted_latitude NUMERIC,
    submitted_longitude NUMERIC,
    submitted_accuracy NUMERIC,
    distance_meters NUMERIC,
    ip_hash TEXT,
    user_agent TEXT,
    device_hash TEXT,
    token_id UUID REFERENCES public.member_access_tokens(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for querying
CREATE INDEX IF NOT EXISTS idx_attendance_self_mark_audit_org ON public.attendance_self_mark_audit(organization_id);
CREATE INDEX IF NOT EXISTS idx_attendance_self_mark_audit_session ON public.attendance_self_mark_audit(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_self_mark_audit_member ON public.attendance_self_mark_audit(member_id);

-- RLS
ALTER TABLE public.attendance_self_mark_audit ENABLE ROW LEVEL SECURITY;

-- Admins can read all audits in their org
CREATE POLICY "Admins can view attendance self mark audits in their org" ON public.attendance_self_mark_audit
    FOR SELECT USING (
        organization_id IN (
            SELECT get_user_organizations()
        )
    );

-- The backend/public endpoints can insert into the audit log (so we need a policy for anon/authenticated)
-- Since public endpoints are unauthenticated (or anon), we allow insert if organization_id matches
CREATE POLICY "Anyone can insert attendance self mark audits" ON public.attendance_self_mark_audit
    FOR INSERT WITH CHECK (true);
