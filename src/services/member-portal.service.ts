import { supabase } from '@/utils/supabase';
import { sendSmsMessage } from './sms.service';
import type { Member } from '@/types/members';
import { baseUrl } from '@/constants/urls';

export interface TokenValidationResult {
  valid: boolean;
  purpose: 'PIN_SETUP' | 'PIN_RESET' | 'VIEW_PROFILE';
  maskedPhone: string;
  memberId: string;
  organizationId: string;
  error?: string;
}

export interface VerifyPhoneResult {
  success: boolean;
  otpId?: string;
  error?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  error?: string;
}

export interface SetupPinResult {
  success: boolean;
  error?: string;
}

export interface LoginResult {
  success: boolean;
  member?: Member;
  error?: string;
}

export const memberPortalService = {
  /**
   * Validates a short-link token to ensure it hasn't expired or been used.
   * Returns masked phone number for the next step.
   * Requires Supabase RPC: `validate_member_token(p_token text)`
   */
  async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      const { data, error } = await supabase.rpc('validate_member_token', {
        p_token: token,
      });

      if (error) throw error;
      if (!data || !data.valid) {
        return { valid: false, error: data?.error || 'Invalid or expired link.', purpose: 'VIEW_PROFILE', maskedPhone: '', memberId: '', organizationId: '' };
      }

      return {
        valid: true,
        purpose: data.purpose,
        maskedPhone: data.masked_phone,
        memberId: data.member_id,
        organizationId: data.organization_id,
      };
    } catch (err: any) {
      console.error('Failed to validate token:', err);
      return { valid: false, error: err.message, purpose: 'VIEW_PROFILE', maskedPhone: '', memberId: '', organizationId: '' };
    }
  },

  /**
   * Verifies the full phone number matches the masked one.
   * If successful, generates an OTP and sends it via SMS.
   * Requires Supabase RPC: `verify_member_phone_generate_otp(p_token text, p_phone text)`
   */
  async verifyPhoneAndSendOtp(token: string, phone: string, organizationName: string, smsSenderId?: string): Promise<VerifyPhoneResult> {
    try {
      // 1. Call RPC to verify phone and generate an OTP code
      const { data, error } = await supabase.rpc('verify_member_phone_generate_otp', {
        p_token: token,
        p_phone: phone,
      });

      if (error) throw error;
      if (!data || !data.success) {
        return { success: false, error: data?.error || 'Phone number verification failed.' };
      }

      const { otp_code, otp_id, organization_id } = data;

      // 2. Send SMS using the existing sms service
      const message = `Your ${organizationName} portal verification code is: ${otp_code}. It expires in 10 minutes.`;

      await sendSmsMessage({
        sender: smsSenderId || import.meta.env.VITE_DEFAULT_SMS_SENDER_ID || 'CHURCHUB360',
        message,
        recipients: [{ phone }],
        organizationId: organization_id,
      });

      return { success: true, otpId: otp_id };
    } catch (err: any) {
      console.error('Failed to verify phone and send OTP:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Verifies the OTP entered by the user.
   * Requires Supabase RPC: `verify_member_otp(p_otp_id uuid, p_otp_code text)`
   */
  async verifyOtp(otpId: string, otpCode: string): Promise<VerifyOtpResult> {
    try {
      const { data, error } = await supabase.rpc('verify_member_otp', {
        p_otp_id: otpId,
        p_otp_code: otpCode,
      });

      if (error) throw error;
      if (!data || !data.success) {
        return { success: false, error: data?.error || 'Invalid or expired OTP.' };
      }

      return { success: true };
    } catch (err: any) {
      console.error('Failed to verify OTP:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Sets up a new PIN for the member.
   * Requires Supabase RPC: `setup_member_pin(p_token text, p_pin text)`
   */
  async setupPin(token: string, pin: string): Promise<SetupPinResult> {
    try {
      const { data, error } = await supabase.rpc('setup_member_pin', {
        p_token: token,
        p_pin: pin,
      });

      if (error) throw error;
      if (!data || !data.success) {
        return { success: false, error: data?.error || 'Failed to setup PIN.' };
      }

      return { success: true };
    } catch (err: any) {
      console.error('Failed to setup PIN:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Authenticates a member using phone number and PIN.
   * Requires Supabase RPC: `authenticate_member_pin(p_phone text, p_pin text)`
   */
  async loginWithPin(phone: string, pin: string): Promise<LoginResult> {
    try {
      const { data, error } = await supabase.rpc('authenticate_member_pin', {
        p_phone: phone,
        p_pin: pin,
      });

      if (error) throw error;
      if (!data || !data.success) {
        return { success: false, error: data?.error || 'Invalid phone number or PIN.' };
      }

      // data.member should contain the JSON representation of the member
      return { success: true, member: data.member };
    } catch (err: any) {
      console.error('Failed to authenticate with PIN:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Generates a new access link for a member (Admin action).
   * Requires Admin session.
   */
  async generateAccessLink(memberId: string, organizationId: string, purpose: 'PIN_SETUP' | 'PIN_RESET' | 'VIEW_PROFILE'): Promise<string> {
    // Generate a secure random token
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').substring(0, 16);

    // Calculate expiration (Setup: 7 days, Reset: 1 hour, View: 24 hours)
    const expiresAt = new Date();
    if (purpose === 'PIN_SETUP') expiresAt.setDate(expiresAt.getDate() + 7);
    else if (purpose === 'PIN_RESET') expiresAt.setHours(expiresAt.getHours() + 1);
    else expiresAt.setHours(expiresAt.getHours() + 24);

    // Insert into member_access_tokens
    const { error: tokenError } = await supabase.from('member_access_tokens').insert({
      member_id: memberId,
      organization_id: organizationId,
      token,
      purpose,
      expires_at: expiresAt.toISOString(),
      is_used: false,
    });

    if (tokenError) throw tokenError;

    // Generate short URL code (simple 8 char alphanumeric)
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Insert into short_urls
    const { error: shortUrlError } = await supabase.from('short_urls').insert({
      code,
      long_url: `${baseUrl}/#/m/verify?token=${token}`,
      expires_at: expiresAt.toISOString(),
      organization_id: organizationId,
    });

    if (shortUrlError) throw shortUrlError;

    return `${baseUrl}/#/s/${code}`;
  }
};
