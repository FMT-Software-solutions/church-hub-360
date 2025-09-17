-- Function to update is_active column in auth_users table based on organization membership
CREATE OR REPLACE FUNCTION update_auth_users_is_active()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user has at least one active organization membership
  IF EXISTS (
    SELECT 1 
    FROM user_organizations 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) 
    AND is_active = true
  ) THEN
    -- Update is_active to true if user is active in at least one organization
    UPDATE auth_users 
    SET is_active = true, updated_at = NOW()
    WHERE id = COALESCE(NEW.user_id, OLD.user_id) 
    AND is_active = false;
  ELSE
    -- Update is_active to false if user is not active in any organization
    UPDATE auth_users 
    SET is_active = false, updated_at = NOW()
    WHERE id = COALESCE(NEW.user_id, OLD.user_id) 
    AND is_active = true;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on user_organizations table for INSERT operations
CREATE OR REPLACE TRIGGER trigger_update_is_active_on_insert
  AFTER INSERT ON user_organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_auth_users_is_active();

-- Create trigger on user_organizations table for UPDATE operations
CREATE OR REPLACE TRIGGER trigger_update_is_active_on_update
  AFTER UPDATE ON user_organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_auth_users_is_active();

-- Create trigger on user_organizations table for DELETE operations
CREATE OR REPLACE TRIGGER trigger_update_is_active_on_delete
  AFTER DELETE ON user_organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_auth_users_is_active();

-- Update existing records to set correct is_active values
UPDATE auth_users 
SET is_active = (
  EXISTS (
    SELECT 1 
    FROM user_organizations 
    WHERE user_organizations.user_id = auth_users.id 
    AND user_organizations.is_active = true
  )
), updated_at = NOW();