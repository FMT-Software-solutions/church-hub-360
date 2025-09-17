create table public.auth_users (
  id uuid not null,
  email text not null,
  is_active boolean null default true,
  is_first_login boolean null default true,
  password_updated boolean null default false,
  last_login timestamp with time zone null,
  otp_requests_count integer null default 0,
  last_otp_request timestamp with time zone null,
  is_owner boolean null default false,
  has_purchased boolean null default false,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint auth_users_pkey primary key (id),
   constraint profiles_email_key unique (email),
  constraint auth_users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint auth_users_id_fkey1 foreign KEY (id) references profiles (id) on delete SET NULL
) TABLESPACE pg_default;

create index IF not exists idx_auth_users_email on public.auth_users using btree (email) TABLESPACE pg_default;
create index IF not exists idx_auth_users_id_profiles on public.auth_users using btree (id) TABLESPACE pg_default; -- For profiles relationship

create trigger handle_auth_users_updated_at BEFORE
update on auth_users for EACH row
execute FUNCTION handle_updated_at ();

-- Enable RLS
ALTER TABLE public.auth_users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users all access
CREATE POLICY "Allow authenticated users all access" ON public.auth_users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to update is_owner column in auth_users table
CREATE OR REPLACE FUNCTION update_auth_users_is_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user has at least one owner role in any organization
  IF EXISTS (
    SELECT 1 
    FROM user_organizations 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) 
    AND role = 'owner' 
    AND is_active = true
  ) THEN
    -- Update is_owner to true if user is owner in at least one organization
    UPDATE auth_users 
    SET is_owner = true, updated_at = NOW()
    WHERE id = COALESCE(NEW.user_id, OLD.user_id) 
    AND is_owner = false;
  ELSE
    -- Update is_owner to false if user is not owner in any organization
    UPDATE auth_users 
    SET is_owner = false, updated_at = NOW()
    WHERE id = COALESCE(NEW.user_id, OLD.user_id) 
    AND is_owner = true;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on user_organizations table for INSERT operations
CREATE OR REPLACE TRIGGER trigger_update_is_owner_on_insert
  AFTER INSERT ON user_organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_auth_users_is_owner();

-- Create trigger on user_organizations table for UPDATE operations
CREATE OR REPLACE TRIGGER trigger_update_is_owner_on_update
  AFTER UPDATE ON user_organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_auth_users_is_owner();

-- Create trigger on user_organizations table for DELETE operations
CREATE OR REPLACE TRIGGER trigger_update_is_owner_on_delete
  AFTER DELETE ON user_organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_auth_users_is_owner();

-- Update existing records to set correct is_owner values
UPDATE auth_users 
SET is_owner = (
  EXISTS (
    SELECT 1 
    FROM user_organizations 
    WHERE user_organizations.user_id = auth_users.id 
    AND user_organizations.role = 'owner' 
    AND user_organizations.is_active = true
  )
), updated_at = NOW();