ALTER TABLE user_organizations 
ADD COLUMN IF NOT EXISTS can_approve_requests BOOLEAN DEFAULT FALSE;
