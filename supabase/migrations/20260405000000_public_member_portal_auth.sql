-- Add PIN authentication fields to members table
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS pin_hash TEXT,
ADD COLUMN IF NOT EXISTS pin_setup_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_pin_active BOOLEAN DEFAULT true;

-- Create member_access_tokens table
CREATE TABLE IF NOT EXISTS public.member_access_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    purpose TEXT NOT NULL CHECK (purpose IN ('PIN_SETUP', 'PIN_RESET', 'VIEW_PROFILE', 'MARK_ATTENDANCE')),
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for member_access_tokens
CREATE INDEX IF NOT EXISTS idx_member_access_tokens_token ON public.member_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_member_access_tokens_member_id ON public.member_access_tokens(member_id);

-- Create member_otps table
CREATE TABLE IF NOT EXISTS public.member_otps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for member_otps
CREATE INDEX IF NOT EXISTS idx_member_otps_member_id ON public.member_otps(member_id);

-- Enable RLS
ALTER TABLE public.member_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_otps ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role has full access to member_access_tokens" ON public.member_access_tokens
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access to member_otps" ON public.member_otps
    FOR ALL USING (auth.role() = 'service_role');

-- -- Admins can view and insert access tokens for their organization
-- CREATE POLICY "Admins can manage access tokens" ON public.member_access_tokens
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM public.user_organizations
--             WHERE user_organizations.user_id = auth.uid() 
--             AND user_organizations.organization_id = member_access_tokens.organization_id
--             AND user_organizations.role IN ('owner', 'admin', 'branch_admin')
--         )
--     );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_member_access_tokens_modtime ON public.member_access_tokens;
CREATE TRIGGER update_member_access_tokens_modtime
    BEFORE UPDATE ON public.member_access_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_member_otps_modtime ON public.member_otps;
CREATE TRIGGER update_member_otps_modtime
    BEFORE UPDATE ON public.member_otps
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- ==========================================
-- RPC Functions for Member Portal Auth
-- ==========================================

-- 1. Validate Token
CREATE OR REPLACE FUNCTION public.validate_member_token(p_token TEXT)
RETURNS JSON AS $$
DECLARE
    v_token_record RECORD;
    v_member_phone TEXT;
    v_masked_phone TEXT;
BEGIN
    -- Find the token
    SELECT * INTO v_token_record
    FROM public.member_access_tokens
    WHERE token = p_token AND is_used = false AND expires_at > NOW();

    IF NOT FOUND THEN
        RETURN json_build_object('valid', false, 'error', 'Invalid or expired link.');
    END IF;

    -- Get member's phone
    SELECT phone INTO v_member_phone
    FROM public.members
    WHERE id = v_token_record.member_id;

    IF v_member_phone IS NULL OR length(v_member_phone) < 4 THEN
        RETURN json_build_object('valid', false, 'error', 'No valid phone number associated with this member account.');
    END IF;

    -- Create masked phone (e.g. "ends in ...567")
    v_masked_phone := '...' || right(v_member_phone, 3);

    RETURN json_build_object(
        'valid', true,
        'purpose', v_token_record.purpose,
        'masked_phone', v_masked_phone,
        'member_id', v_token_record.member_id,
        'organization_id', v_token_record.organization_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Verify Phone & Generate OTP
CREATE OR REPLACE FUNCTION public.verify_member_phone_generate_otp(p_token TEXT, p_phone TEXT)
RETURNS JSON AS $$
DECLARE
    v_token_record RECORD;
    v_member_record RECORD;
    v_otp_code TEXT;
    v_otp_id UUID;
    v_normalized_input_phone TEXT;
    v_normalized_db_phone TEXT;
BEGIN
    -- Find and validate token
    SELECT * INTO v_token_record
    FROM public.member_access_tokens
    WHERE token = p_token AND is_used = false AND expires_at > NOW();

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Invalid or expired link.');
    END IF;

    -- Find member and verify phone
    SELECT * INTO v_member_record
    FROM public.members
    WHERE id = v_token_record.member_id;

    -- Normalize input phone (remove spaces, dashes, parentheses, plus sign)
    v_normalized_input_phone := regexp_replace(p_phone, '[\s\-\(\)\+]', '', 'g');
    -- Standardize input to a common format (e.g., strip leading 233 or 0)
    IF v_normalized_input_phone LIKE '233%' THEN
        v_normalized_input_phone := substring(v_normalized_input_phone from 4);
    ELSIF v_normalized_input_phone LIKE '0%' THEN
        v_normalized_input_phone := substring(v_normalized_input_phone from 2);
    END IF;

    -- Normalize DB phone
    IF v_member_record.phone IS NOT NULL THEN
        v_normalized_db_phone := regexp_replace(v_member_record.phone, '[\s\-\(\)\+]', '', 'g');
        IF v_normalized_db_phone LIKE '233%' THEN
            v_normalized_db_phone := substring(v_normalized_db_phone from 4);
        ELSIF v_normalized_db_phone LIKE '0%' THEN
            v_normalized_db_phone := substring(v_normalized_db_phone from 2);
        END IF;
    ELSE
        v_normalized_db_phone := '';
    END IF;


    IF v_normalized_db_phone IS DISTINCT FROM v_normalized_input_phone THEN
        RETURN json_build_object('success', false, 'error', 'Phone number does not match our records.');
    END IF;

    -- Generate 6-digit OTP
    v_otp_code := lpad(floor(random() * 1000000)::text, 6, '0');

    -- Insert OTP record
    INSERT INTO public.member_otps (organization_id, member_id, otp_code, expires_at)
    VALUES (v_token_record.organization_id, v_token_record.member_id, v_otp_code, NOW() + INTERVAL '10 minutes')
    RETURNING id INTO v_otp_id;

    RETURN json_build_object(
        'success', true,
        'otp_id', v_otp_id,
        'otp_code', v_otp_code,
        'organization_id', v_token_record.organization_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Verify OTP
CREATE OR REPLACE FUNCTION public.verify_member_otp(p_otp_id UUID, p_otp_code TEXT)
RETURNS JSON AS $$
DECLARE
    v_otp_record RECORD;
BEGIN
    SELECT * INTO v_otp_record
    FROM public.member_otps
    WHERE id = p_otp_id AND is_used = false AND expires_at > NOW();

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'OTP is invalid or expired.');
    END IF;

    IF v_otp_record.otp_code != p_otp_code THEN
        RETURN json_build_object('success', false, 'error', 'Incorrect verification code.');
    END IF;

    -- Mark OTP as used
    UPDATE public.member_otps SET is_used = true WHERE id = p_otp_id;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Setup PIN
CREATE OR REPLACE FUNCTION public.setup_member_pin(p_token TEXT, p_pin TEXT)
RETURNS JSON AS $$
DECLARE
    v_token_record RECORD;
    v_hashed_pin TEXT;
BEGIN
    -- Find token
    SELECT * INTO v_token_record
    FROM public.member_access_tokens
    WHERE token = p_token AND is_used = false AND expires_at > NOW();

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Invalid or expired link.');
    END IF;

    -- Hash the PIN using pgcrypto extension's crypt function
    v_hashed_pin := crypt(p_pin, gen_salt('bf'));

    -- Update member
    UPDATE public.members 
    SET pin_hash = v_hashed_pin, 
        pin_setup_at = NOW(),
        is_pin_active = true
    WHERE id = v_token_record.member_id;

    -- Mark token as used
    UPDATE public.member_access_tokens SET is_used = true WHERE id = v_token_record.id;
    
    -- Also mark the corresponding short_url as expired/used so it can't even route to the app again
    -- We match it based on the token present in the long_url
    UPDATE public.short_urls 
    SET expires_at = NOW() - INTERVAL '1 minute'
    WHERE long_url LIKE '%token=' || p_token;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Authenticate PIN
CREATE OR REPLACE FUNCTION public.authenticate_member_pin(p_phone TEXT, p_pin TEXT)
RETURNS JSON AS $$
DECLARE
    v_member_record RECORD;
    v_member_summary RECORD;
    v_normalized_input_phone TEXT;
    v_normalized_db_phone TEXT;
BEGIN
    -- Normalize input phone (remove spaces, dashes, parentheses, plus sign)
    v_normalized_input_phone := regexp_replace(p_phone, '[\s\-\(\)\+]', '', 'g');
    -- Standardize input to a common format (e.g., strip leading 233 or 0)
    IF v_normalized_input_phone LIKE '233%' THEN
        v_normalized_input_phone := substring(v_normalized_input_phone from 4);
    ELSIF v_normalized_input_phone LIKE '0%' THEN
        v_normalized_input_phone := substring(v_normalized_input_phone from 2);
    END IF;

    -- Find member by matching normalized phone
    FOR v_member_record IN 
        SELECT * FROM public.members WHERE is_pin_active = true AND phone IS NOT NULL
    LOOP
        v_normalized_db_phone := regexp_replace(v_member_record.phone, '[\s\-\(\)\+]', '', 'g');
        IF v_normalized_db_phone LIKE '233%' THEN
            v_normalized_db_phone := substring(v_normalized_db_phone from 4);
        ELSIF v_normalized_db_phone LIKE '0%' THEN
            v_normalized_db_phone := substring(v_normalized_db_phone from 2);
        END IF;

        IF v_normalized_db_phone = v_normalized_input_phone THEN
            EXIT; -- Found a match, exit loop
        END IF;
    END LOOP;

    -- If loop finished without finding a match, v_member_record.id will be NULL or empty
    -- Need to handle this cleanly. A better way in PG is to use a CTE/subquery, but for simplicity here:
    IF v_member_record IS NULL OR v_normalized_db_phone IS DISTINCT FROM v_normalized_input_phone THEN
        RETURN json_build_object('success', false, 'error', 'Invalid phone number or PIN.');
    END IF;

    IF v_member_record.pin_hash IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'PIN not set up for this account.');
    END IF;

    -- Verify PIN
    IF v_member_record.pin_hash = crypt(p_pin, v_member_record.pin_hash) THEN
        -- Get specific required member details instead of the entire summary row
        -- We join with members_summary to get aggregated tags and groups
        SELECT json_build_object(
            'id', ms.id,
            'first_name', ms.first_name,
            'last_name', ms.last_name,
            'middle_name', ms.middle_name,
            'profile_image_url', ms.profile_image_url,
            'gender', ms.gender,
            'date_of_birth', ms.date_of_birth,
            'marital_status', m.marital_status,
            'phone', ms.phone,
            'email', ms.email,
            'address_line_1', ms.address_line_1,
            'address_line_2', ms.address_line_2,
            'city', ms.city,
            'state', ms.state,
            'country', ms.country,
            'emergency_contact_name', m.emergency_contact_name,
            'emergency_contact_phone', m.emergency_contact_phone,
            'emergency_contact_relationship', m.emergency_contact_relationship,
            'membership_type', ms.membership_type,
            'membership_status', ms.membership_status,
            'date_joined', ms.date_joined,
            'baptism_date', m.baptism_date,
            'confirmation_date', m.confirmation_date,
            'member_groups', ms.member_groups,
            'tags_array', ms.tags_array
        ) INTO v_member_summary
        FROM public.members_summary ms
        JOIN public.members m ON ms.id = m.id
        WHERE ms.id = v_member_record.id;

        RETURN json_build_object(
            'success', true,
            'member', v_member_summary
        );
    ELSE
        RETURN json_build_object('success', false, 'error', 'Invalid phone number or PIN.');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
