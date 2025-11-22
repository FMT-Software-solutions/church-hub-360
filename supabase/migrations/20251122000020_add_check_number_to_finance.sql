-- Add check_number column to finance tables
-- Applies to: income, expenses, pledge_payments

ALTER TABLE public.income
  ADD COLUMN IF NOT EXISTS check_number TEXT NULL;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS check_number TEXT NULL;

ALTER TABLE public.pledge_payments
  ADD COLUMN IF NOT EXISTS check_number TEXT NULL;

