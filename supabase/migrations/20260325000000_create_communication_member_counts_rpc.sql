-- Migration to add communication target member counts RPC function

-- Get target member counts and details for communication
CREATE OR REPLACE FUNCTION get_communication_targets(
  p_organization_id uuid,
  p_target_type text, -- 'all', 'tags', 'groups', 'individuals'
  p_target_ids uuid[] DEFAULT NULL -- tag_item_ids, group_ids, or member_ids based on p_target_type
)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_target_type = 'all' THEN
    RETURN QUERY
    SELECT m.id, m.full_name as name, m.email, m.phone
    FROM members_summary m
    WHERE m.organization_id = p_organization_id AND m.is_active = true;

  ELSIF p_target_type = 'tags' AND p_target_ids IS NOT NULL AND array_length(p_target_ids, 1) > 0 THEN
    RETURN QUERY
    SELECT DISTINCT m.id, m.full_name as name, m.email, m.phone
    FROM members_summary m
    JOIN member_tag_items mti ON m.id = mti.member_id
    WHERE m.organization_id = p_organization_id 
      AND m.is_active = true
      AND mti.tag_item_id = ANY(p_target_ids);

  ELSIF p_target_type = 'groups' AND p_target_ids IS NOT NULL AND array_length(p_target_ids, 1) > 0 THEN
    RETURN QUERY
    SELECT DISTINCT m.id, m.full_name as name, m.email, m.phone
    FROM members_summary m
    JOIN member_assigned_groups mag ON m.id = mag.member_id
    WHERE m.organization_id = p_organization_id 
      AND m.is_active = true
      AND mag.group_id = ANY(p_target_ids);

  ELSIF p_target_type = 'individuals' AND p_target_ids IS NOT NULL AND array_length(p_target_ids, 1) > 0 THEN
    RETURN QUERY
    SELECT m.id, m.full_name as name, m.email, m.phone
    FROM members_summary m
    WHERE m.organization_id = p_organization_id 
      AND m.is_active = true
      AND m.id = ANY(p_target_ids);
      
  ELSE
    -- Empty result for invalid parameters
    RETURN;
  END IF;
END;
$$;