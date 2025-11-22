-- Seed default income category preferences for all organizations
do $$
declare
  default_income_prefs text := '{"categories":[{"key":"offering","label":"Offering"},{"key":"missions_offering","label":"Missions Offering"},{"key":"special_offering","label":"Special Offering"},{"key":"tithe","label":"Tithe"},{"key":"contribution","label":"Contribution"},{"key":"donation","label":"Donation"},{"key":"fundraising","label":"Fundraising"},{"key":"harvest","label":"Harvest"},{"key":"thanksgiving","label":"Thanksgiving"},{"key":"special_thanksgiving","label":"Special Thanksgiving"},{"key":"fund","label":"Fund"},{"key":"grant","label":"Grant"},{"key":"special_grant","label":"Special Grant"},{"key":"other","label":"Other"}]}';
  default_expenses_prefs text := '{"categories":[{"key":"utilities","label":"Utilities","purposes":["Electricity","Water","Internet","Gas","Waste"]},{"key":"maintenance","label":"Maintenance","purposes":["Building Repairs","Equipment Repairs","Maintenance Contract"]},{"key":"supplies","label":"Supplies","purposes":["Office Supplies","Cleaning Supplies","Consumables"]},{"key":"equipment","label":"Equipment","purposes":["Audio Equipment","Furniture","IT Equipment"]},{"key":"salaries","label":"Salaries","purposes":["Pastoral Staff","Administrative Staff","Support Staff"]},{"key":"benefits","label":"Benefits","purposes":["Health Insurance","Retirement","Allowances"]},{"key":"ministry_expenses","label":"Ministry Expenses","purposes":["Children Ministry","Youth Ministry","Music Ministry"]},{"key":"outreach","label":"Outreach","purposes":["Community Outreach","Advertising","Evangelism Materials"]},{"key":"missions","label":"Missions","purposes":["Mission Trip Support","Missionary Support","Local Missions"]},{"key":"events","label":"Events","purposes":["Conference","Retreat","Workshop"]},{"key":"transportation","label":"Transportation","purposes":["Fuel","Vehicle Maintenance","Transport Services"]},{"key":"insurance","label":"Insurance","purposes":["Property Insurance","Vehicle Insurance","Liability Insurance"]},{"key":"professional_services","label":"Professional Services","purposes":["Accounting","Legal","Consulting"]},{"key":"other","label":"Other","purposes":["Miscellaneous"]}]}';
begin
  -- Ensure income_category_prefs column exists (idempotent safety)
  alter table public.finance_preferences
    add column if not exists income_category_prefs text null;

  -- Set default for new rows (literal to avoid function dependency)
  alter table public.finance_preferences
    alter column income_category_prefs set default $prefs$
    {"categories":[{"key":"offering","label":"Offering"},{"key":"missions_offering","label":"Missions Offering"},{"key":"special_offering","label":"Special Offering"},{"key":"tithe","label":"Tithe"},{"key":"contribution","label":"Contribution"},{"key":"donation","label":"Donation"},{"key":"fundraising","label":"Fundraising"},{"key":"harvest","label":"Harvest"},{"key":"thanksgiving","label":"Thanksgiving"},{"key":"special_thanksgiving","label":"Special Thanksgiving"},{"key":"fund","label":"Fund"},{"key":"grant","label":"Grant"},{"key":"special_grant","label":"Special Grant"},{"key":"other","label":"Other"}]} $prefs$;

  -- Backfill existing rows missing income_category_prefs
  update public.finance_preferences
  set income_category_prefs = default_income_prefs
  where income_category_prefs is null;

  -- Insert rows for organizations that do not have finance_preferences yet
  insert into public.finance_preferences (organization_id, expenses_prefs, income_category_prefs)
  select o.id, default_expenses_prefs, default_income_prefs
  from public.organizations o
  where not exists (
    select 1 from public.finance_preferences fp where fp.organization_id = o.id
  );
end $$;

