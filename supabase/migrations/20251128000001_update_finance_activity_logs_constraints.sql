
-- Update action_type check constraint to include edit request actions
ALTER TABLE public.finance_activity_logs DROP CONSTRAINT IF EXISTS finance_activity_logs_action_type_check;

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
