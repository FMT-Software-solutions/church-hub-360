-- Migration to add financial fields to assets table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS purchase_cost numeric(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS depreciation_percentage numeric(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sold_amount numeric(12, 2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sold_date timestamptz DEFAULT NULL;

-- Add comment to explain the fields
COMMENT ON COLUMN public.assets.purchase_cost IS 'Original purchase cost of the asset';
COMMENT ON COLUMN public.assets.depreciation_percentage IS 'Flat rate depreciation percentage (0-100)';
COMMENT ON COLUMN public.assets.sold_amount IS 'Amount the asset was sold for (if applicable)';
COMMENT ON COLUMN public.assets.sold_date IS 'Date when the asset was sold';
