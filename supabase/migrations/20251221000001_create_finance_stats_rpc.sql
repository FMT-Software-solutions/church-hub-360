-- Migration to add finance statistics RPC functions

-- 1. Get Income Statistics
CREATE OR REPLACE FUNCTION get_income_stats(
  p_organization_id uuid,
  p_filters jsonb,
  p_search_text text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  WITH filtered_data AS (
    SELECT 
      i.amount,
      i.category
    FROM income i
    WHERE i.organization_id = p_organization_id
    AND i.is_deleted = false
    -- Date Filter
    AND (
      (p_filters->'date_filter'->>'start_date')::date IS NULL OR
      i.date >= (p_filters->'date_filter'->>'start_date')::date
    )
    AND (
      (p_filters->'date_filter'->>'end_date')::date IS NULL OR
      i.date <= (p_filters->'date_filter'->>'end_date')::date
    )
    -- Branch Filter
    AND (
      p_filters->'branch_id_filter' IS NULL OR jsonb_array_length(p_filters->'branch_id_filter') = 0 OR
      i.branch_id = ANY(ARRAY(SELECT (jsonb_array_elements_text(p_filters->'branch_id_filter'))::uuid))
    )
    -- Category Filter
    AND (
      p_filters->'category_filter' IS NULL OR jsonb_array_length(p_filters->'category_filter') = 0 OR
      i.category = ANY(ARRAY(SELECT jsonb_array_elements_text(p_filters->'category_filter')))
    )
    -- Income Type Filter (if passed in filters)
    AND (
      p_filters->'income_type_filter' IS NULL OR jsonb_array_length(p_filters->'income_type_filter') = 0 OR
      i.income_type = ANY(ARRAY(SELECT jsonb_array_elements_text(p_filters->'income_type_filter')))
    )
    -- Single Income Type (if passed as specific filter)
    AND (
      p_filters->>'income_type' IS NULL OR
      i.income_type = p_filters->>'income_type'
    )
    -- Payment Method Filter
    AND (
      p_filters->'payment_method_filter' IS NULL OR jsonb_array_length(p_filters->'payment_method_filter') = 0 OR
      i.payment_method = ANY(ARRAY(SELECT jsonb_array_elements_text(p_filters->'payment_method_filter')))
    )
    -- Search Text
    AND (
      p_search_text IS NULL OR p_search_text = '' OR
      i.description ILIKE '%' || p_search_text || '%' OR
      i.category ILIKE '%' || p_search_text || '%' OR
      i.source ILIKE '%' || p_search_text || '%' OR
      i.receipt_number ILIKE '%' || p_search_text || '%'
    )
  ),
  aggregates AS (
    SELECT
      COALESCE(SUM(amount), 0) as total_income,
      COUNT(*) as record_count,
      COALESCE(AVG(amount), 0) as average_income
    FROM filtered_data
  ),
  top_cat AS (
    SELECT category, SUM(amount) as total
    FROM filtered_data
    GROUP BY category
    ORDER BY total DESC
    LIMIT 1
  )
  SELECT jsonb_build_object(
    'total_income', (SELECT total_income FROM aggregates),
    'record_count', (SELECT record_count FROM aggregates),
    'average_income', (SELECT average_income FROM aggregates),
    'top_occasion', COALESCE((SELECT category FROM top_cat), 'N/A'),
    'top_occasion_amount', COALESCE((SELECT total FROM top_cat), 0)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 2. Get Expense Statistics
CREATE OR REPLACE FUNCTION get_expense_stats(
  p_organization_id uuid,
  p_filters jsonb,
  p_search_text text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  WITH filtered_data AS (
    SELECT 
      e.amount,
      e.purpose
    FROM expenses e
    WHERE e.organization_id = p_organization_id
    AND e.is_deleted = false
    -- Date Filter
    AND (
      (p_filters->'date_filter'->>'start_date')::date IS NULL OR
      e.date >= (p_filters->'date_filter'->>'start_date')::date
    )
    AND (
      (p_filters->'date_filter'->>'end_date')::date IS NULL OR
      e.date <= (p_filters->'date_filter'->>'end_date')::date
    )
    -- Category Filter
    AND (
      p_filters->'category_filter' IS NULL OR jsonb_array_length(p_filters->'category_filter') = 0 OR
      e.category = ANY(ARRAY(SELECT jsonb_array_elements_text(p_filters->'category_filter')))
    )
    -- Payment Method Filter
    AND (
      p_filters->'payment_method_filter' IS NULL OR jsonb_array_length(p_filters->'payment_method_filter') = 0 OR
      e.payment_method = ANY(ARRAY(SELECT jsonb_array_elements_text(p_filters->'payment_method_filter')))
    )
    -- Purpose Filter (exact match on description/purpose usually, but here we use purpose column)
    -- Note: Frontend filter logic for purpose might be complex (OR logic), simplifying here to purpose column
    AND (
      p_filters->'purpose_filter' IS NULL OR jsonb_array_length(p_filters->'purpose_filter') = 0 OR
      e.purpose = ANY(ARRAY(SELECT jsonb_array_elements_text(p_filters->'purpose_filter')))
    )
    -- Search Text
    AND (
      p_search_text IS NULL OR p_search_text = '' OR
      e.description ILIKE '%' || p_search_text || '%' OR
      e.purpose ILIKE '%' || p_search_text || '%' OR
      e.vendor ILIKE '%' || p_search_text || '%' OR
      e.receipt_number ILIKE '%' || p_search_text || '%'
    )
  ),
  aggregates AS (
    SELECT
      COALESCE(SUM(amount), 0) as total_expenses,
      COUNT(*) as record_count,
      COALESCE(AVG(amount), 0) as average_expense
    FROM filtered_data
  ),
  top_purp AS (
    SELECT purpose, SUM(amount) as total
    FROM filtered_data
    GROUP BY purpose
    ORDER BY total DESC
    LIMIT 1
  )
  SELECT jsonb_build_object(
    'total_expenses', (SELECT total_expenses FROM aggregates),
    'record_count', (SELECT record_count FROM aggregates),
    'average_expense', (SELECT average_expense FROM aggregates),
    'top_purpose', COALESCE((SELECT purpose FROM top_purp), 'N/A'),
    'top_purpose_amount', COALESCE((SELECT total FROM top_purp), 0)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 3. Get Contribution Statistics
CREATE OR REPLACE FUNCTION get_contribution_stats(
  p_organization_id uuid,
  p_filters jsonb,
  p_search_text text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  WITH filtered_data AS (
    SELECT 
      i.amount,
      i.income_type,
      i.source_type,
      i.source,
      i.member_id,
      i.group_id,
      i.tag_item_id,
      -- We need derived contributor name
      CASE
        WHEN i.source_type = 'member' THEN (
            SELECT COALESCE(m.first_name || ' ' || m.last_name, 'Unknown') 
            FROM members m WHERE m.id = i.member_id
        )
        WHEN i.source_type = 'group' THEN (
            SELECT g.name FROM groups g WHERE g.id = i.group_id
        )
        WHEN i.source_type = 'tag_item' THEN (
            SELECT t.name FROM tag_items t WHERE t.id = i.tag_item_id
        )
        ELSE COALESCE(i.source, 'Other')
      END as contributor_name
    FROM income i
    WHERE i.organization_id = p_organization_id
    AND i.is_deleted = false
    -- We assume this function is called with income_types=['contribution', 'donation'] usually
    AND (
      p_filters->'income_type_filter' IS NULL OR jsonb_array_length(p_filters->'income_type_filter') = 0 OR
      i.income_type = ANY(ARRAY(SELECT jsonb_array_elements_text(p_filters->'income_type_filter')))
    )
    AND (
      p_filters->>'income_type' IS NULL OR
      i.income_type = p_filters->>'income_type'
    )
     -- Array of income types (used by Contributions page 'all' filter)
    AND (
      p_filters->'income_types' IS NULL OR jsonb_array_length(p_filters->'income_types') = 0 OR
      i.income_type = ANY(ARRAY(SELECT jsonb_array_elements_text(p_filters->'income_types')))
    )
    -- Date Filter
    AND (
      (p_filters->'date_filter'->>'start_date')::date IS NULL OR
      i.date >= (p_filters->'date_filter'->>'start_date')::date
    )
    AND (
      (p_filters->'date_filter'->>'end_date')::date IS NULL OR
      i.date <= (p_filters->'date_filter'->>'end_date')::date
    )
     -- Category Filter
    AND (
      p_filters->'category_filter' IS NULL OR jsonb_array_length(p_filters->'category_filter') = 0 OR
      i.category = ANY(ARRAY(SELECT jsonb_array_elements_text(p_filters->'category_filter')))
    )
     -- Payment Method Filter
    AND (
      p_filters->'payment_method_filter' IS NULL OR jsonb_array_length(p_filters->'payment_method_filter') = 0 OR
      i.payment_method = ANY(ARRAY(SELECT jsonb_array_elements_text(p_filters->'payment_method_filter')))
    )
    -- Search Text
    AND (
      p_search_text IS NULL OR p_search_text = '' OR
      i.description ILIKE '%' || p_search_text || '%' OR
      i.category ILIKE '%' || p_search_text || '%' OR
      i.source ILIKE '%' || p_search_text || '%'
    )
  ),
  aggregates AS (
    SELECT
      COALESCE(SUM(amount), 0) as total_amount,
      COALESCE(SUM(amount) FILTER (WHERE income_type = 'contribution'), 0) as total_contribution_amount,
      COALESCE(SUM(amount) FILTER (WHERE income_type = 'donation'), 0) as total_donation_amount,
      COUNT(*) as record_count,
      COALESCE(AVG(amount), 0) as average_amount
    FROM filtered_data
  ),
  top_contrib AS (
    SELECT contributor_name, SUM(amount) as total
    FROM filtered_data
    GROUP BY contributor_name
    ORDER BY total DESC
    LIMIT 1
  )
  SELECT jsonb_build_object(
    'totalAmount', (SELECT total_amount FROM aggregates),
    'totalContributionAmount', (SELECT total_contribution_amount FROM aggregates),
    'totalDonationAmount', (SELECT total_donation_amount FROM aggregates),
    'recordCount', (SELECT record_count FROM aggregates),
    'averageAmount', (SELECT average_amount FROM aggregates),
    'topContributor', COALESCE((SELECT contributor_name FROM top_contrib), 'None'),
    'topContributorAmount', COALESCE((SELECT total FROM top_contrib), 0)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 4. Get Pledge Statistics
CREATE OR REPLACE FUNCTION get_pledge_stats(
  p_organization_id uuid,
  p_filters jsonb,
  p_search_text text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  WITH filtered_data AS (
    SELECT 
      p.pledge_amount,
      p.amount_paid,
      p.amount_remaining,
      p.start_date,
      p.created_at
    FROM pledge_records p
    WHERE p.organization_id = p_organization_id
    AND p.is_deleted = false
    AND (
      (p_filters->'date_filter'->>'start_date')::date IS NULL OR
      COALESCE(p.start_date::date, p.created_at::date) >= (p_filters->'date_filter'->>'start_date')::date
    )
    AND (
      (p_filters->'date_filter'->>'end_date')::date IS NULL OR
      COALESCE(p.start_date::date, p.created_at::date) <= (p_filters->'date_filter'->>'end_date')::date
    )
    -- Branch Filter
    AND (
      p_filters->'branch_id_filter' IS NULL OR jsonb_array_length(p_filters->'branch_id_filter') = 0 OR
      p.branch_id = ANY(ARRAY(SELECT (jsonb_array_elements_text(p_filters->'branch_id_filter'))::uuid))
    )
    -- Search Text
    AND (
      p_search_text IS NULL OR p_search_text = '' OR
      p.description ILIKE '%' || p_search_text || '%' OR
      p.campaign_name ILIKE '%' || p_search_text || '%'
    )
  ),
  aggregates AS (
    SELECT
      COALESCE(SUM(pledge_amount), 0) as total_pledges,
      COALESCE(SUM(amount_paid), 0) as fulfilled_amount,
      COALESCE(SUM(amount_remaining), 0) as pending_amount,
      COUNT(*) as record_count
    FROM filtered_data
  )
  SELECT jsonb_build_object(
    'totalPledges', (SELECT total_pledges FROM aggregates),
    'recordCount', (SELECT record_count FROM aggregates),
    'fulfilledAmount', (SELECT fulfilled_amount FROM aggregates),
    'pendingAmount', (SELECT pending_amount FROM aggregates),
    'fulfillmentRate', CASE 
        WHEN (SELECT total_pledges FROM aggregates) > 0 
        THEN ((SELECT fulfilled_amount FROM aggregates) / (SELECT total_pledges FROM aggregates)) * 100 
        ELSE 0 
    END
  ) INTO v_result;

  RETURN v_result;
END;
$$;
