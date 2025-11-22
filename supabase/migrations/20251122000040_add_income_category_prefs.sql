-- Add income_category_prefs column to finance_preferences and seed defaults
do $$
declare
  default_income_prefs text := '{"categories":[{"key":"offering","label":"Offering"},{"key":"missions_offering","label":"Missions Offering"},{"key":"special_offering","label":"Special Offering"},{"key":"tithe","label":"Tithe"},{"key":"contribution","label":"Contribution"},{"key":"donation","label":"Donation"},{"key":"fundraising","label":"Fundraising"},{"key":"harvest","label":"Harvest"},{"key":"thanksgiving","label":"Thanksgiving"},{"key":"special_thanksgiving","label":"Special Thanksgiving"},{"key":"fund","label":"Fund"},{"key":"grant","label":"Grant"},{"key":"special_grant","label":"Special Grant"},{"key":"other","label":"Other"}]}';
begin
  alter table public.finance_preferences
    add column if not exists income_category_prefs text null;

  alter table public.finance_preferences
    alter column income_category_prefs set default $prefs$ {"categories":[{"key":"offering","label":"Offering"},{"key":"missions_offering","label":"Missions Offering"},{"key":"special_offering","label":"Special Offering"},{"key":"tithe","label":"Tithe"},{"key":"contribution","label":"Contribution"},{"key":"donation","label":"Donation"},{"key":"fundraising","label":"Fundraising"},{"key":"harvest","label":"Harvest"},{"key":"thanksgiving","label":"Thanksgiving"},{"key":"special_thanksgiving","label":"Special Thanksgiving"},{"key":"fund","label":"Fund"},{"key":"grant","label":"Grant"},{"key":"special_grant","label":"Special Grant"},{"key":"other","label":"Other"}]} $prefs$;

  update public.finance_preferences
  set income_category_prefs = default_income_prefs
  where income_category_prefs is null;
end $$;

