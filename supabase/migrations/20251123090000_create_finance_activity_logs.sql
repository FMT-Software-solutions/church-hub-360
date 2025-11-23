CREATE TABLE IF NOT EXISTS public.finance_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  entity_type TEXT CHECK (entity_type IN ('income','expense','pledge_record','pledge_payment','contribution')) NOT NULL,
  entity_id UUID NOT NULL,
  action_type TEXT CHECK (action_type IN ('create','update','delete','print_receipt')) NOT NULL,
  amount NUMERIC(12,2),
  payment_method TEXT,
  metadata JSONB,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_finance_activity_logs_org_created ON public.finance_activity_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_finance_activity_logs_entity ON public.finance_activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_finance_activity_logs_action ON public.finance_activity_logs(action_type);

CREATE OR REPLACE TRIGGER update_finance_activity_logs_updated_at
BEFORE UPDATE ON public.finance_activity_logs
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.finance_activity_logs
  ADD CONSTRAINT finance_activity_logs_actor_id_auth_users_fkey
  FOREIGN KEY (actor_id) REFERENCES public.auth_users(id) ON DELETE SET NULL;

ALTER TABLE public.finance_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY finance_activity_logs_select_org
  ON public.finance_activity_logs FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY finance_activity_logs_insert_org
  ON public.finance_activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    ) AND actor_id = auth.uid()
  );

GRANT SELECT, INSERT ON public.finance_activity_logs TO authenticated;
