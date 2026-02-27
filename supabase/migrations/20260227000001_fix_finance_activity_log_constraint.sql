-- Fix finance_activity_logs check constraint
-- First, try to drop the constraint by its known name
ALTER TABLE public.finance_activity_logs DROP CONSTRAINT IF EXISTS finance_activity_logs_action_type_check;

-- Also drop potential auto-generated name just in case (rare but possible in some pg versions/clients)
ALTER TABLE public.finance_activity_logs DROP CONSTRAINT IF EXISTS finance_activity_logs_action_type_check1;

-- Re-add the constraint with ALL required values
ALTER TABLE public.finance_activity_logs ADD CONSTRAINT finance_activity_logs_action_type_check 
CHECK (action_type IN (
  'create', 
  'update', 
  'delete', 
  'print_receipt', 
  'request_edit', 
  'approve_edit', 
  'reject_edit', 
  'cancel_edit', 
  'complete_edit'
));
