-- Update table_name check constraint to include pledge_record
ALTER TABLE public.edit_requests DROP CONSTRAINT IF EXISTS edit_requests_table_name_check;

ALTER TABLE public.edit_requests ADD CONSTRAINT edit_requests_table_name_check 
CHECK (table_name IN ('income', 'expense', 'pledge_payment', 'pledge_record'));
