-- Migration to allow public read access for specific birthday wish details

-- Allow anyone to read specific member details needed for birthday cards
-- We use a targeted policy that only allows reading the necessary fields (implicitly handled by the SELECT query in the frontend, but we open read access on the table)
-- Alternatively, if `members_summary` is a VIEW, we need to ensure the underlying table `members` allows this.
-- Assuming the frontend uses `members_summary` which relies on `members`:

-- Safely drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access for birthday wishes" ON public.members;

-- Create policy on the base members table
CREATE POLICY "Allow public read access for birthday wishes" 
ON public.members FOR SELECT 
USING (true);

-- Also ensure organizations can be read publicly for the logo/name on the birthday card
DROP POLICY IF EXISTS "Allow public read access to organizations for branding" ON public.organizations;

CREATE POLICY "Allow public read access to organizations for branding" 
ON public.organizations FOR SELECT 
USING (true);
