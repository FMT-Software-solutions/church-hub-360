export type TokenPurpose = 'PIN_SETUP' | 'PIN_RESET' | 'VIEW_PROFILE';

export interface MemberAccessToken {
  id: string;
  member_id: string;
  token: string;
  purpose: TokenPurpose;
  expires_at: string; // ISO date string
  is_used: boolean;
  organization_id: string;
  created_at: string;
}

export interface MemberOtp {
  id: string;
  member_id: string;
  otp_code: string; // usually hashed or securely generated, but we might just store it here for simplicity
  expires_at: string; // ISO date string
  is_used: boolean;
  organization_id: string;
  created_at: string;
}

export interface MemberSession {
  token: string; // The JWT
  member: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    profile_image_url?: string | null;
  };
}
