-- Migration to add default communication templates and set up automatic insertion for new organizations

-- 1. Create a reusable function to insert default templates for an organization
CREATE OR REPLACE FUNCTION insert_default_communication_templates(org_id uuid)
RETURNS void AS $$
BEGIN
  -- New Member Welcome (SMS)
  INSERT INTO public.communication_templates (organization_id, name, type, content)
  VALUES (
    org_id, 
    'Welcome New Member (SMS)', 
    'sms', 
    'Welcome to {organization_name}, {first_name}! We are blessed to have you join our church family. Reach us at {organization_phone} if you need anything.'
  );

  -- New Member Welcome (Email)
  INSERT INTO public.communication_templates (organization_id, name, type, subject, content)
  VALUES (
    org_id, 
    'Welcome New Member (Email)', 
    'email', 
    'Welcome to our Church Family!', 
    'Dear {first_name},<br><br>Welcome to {organization_name}! We are absolutely thrilled to have you join our church family.<br><br>If you have any questions or need prayer, please do not hesitate to reach out to us at {organization_phone} or reply to this email.<br><br>Blessings,<br>The Pastoral Team<br>{organization_name}<br>{organization_address}'
  );

  -- Sunday Service Reminder (SMS)
  INSERT INTO public.communication_templates (organization_id, name, type, content)
  VALUES (
    org_id, 
    'Sunday Service Reminder', 
    'sms', 
    'Hi {first_name}, a quick reminder about our Sunday service tomorrow! We can''t wait to worship with you at {organization_name}. See you there!'
  );

  -- General Announcement (SMS)
  INSERT INTO public.communication_templates (organization_id, name, type, content)
  VALUES (
    org_id, 
    'General Announcement', 
    'sms', 
    'Important update from {organization_name}: [Type your announcement here]. Contact {organization_phone} for more info.'
  );

  -- Tithes & Offerings Thank You (SMS)
  INSERT INTO public.communication_templates (organization_id, name, type, content)
  VALUES (
    org_id, 
    'Donation Thank You', 
    'sms', 
    'Dear {first_name}, thank you for your generous giving to {organization_name}. Your support helps us continue our mission. God bless you!'
  );
END;
$$ LANGUAGE plpgsql;

-- 2. Backfill existing organizations
DO $$
DECLARE
  org RECORD;
BEGIN
  FOR org IN SELECT id FROM public.organizations LOOP
    -- Only insert if they don't already have the welcome template to avoid duplicates on re-runs
    IF NOT EXISTS (SELECT 1 FROM public.communication_templates WHERE organization_id = org.id AND name = 'Welcome New Member (SMS)') THEN
      PERFORM insert_default_communication_templates(org.id);
    END IF;
  END LOOP;
END;
$$;

-- 3. Create a trigger function for new organizations
CREATE OR REPLACE FUNCTION on_organization_created_templates()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM insert_default_communication_templates(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach trigger to the organizations table
DROP TRIGGER IF EXISTS trigger_insert_default_templates_on_org_create ON public.organizations;
CREATE TRIGGER trigger_insert_default_templates_on_org_create
AFTER INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION on_organization_created_templates();
