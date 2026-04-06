# Public Member Portal & PIN Authentication Plan

## Overview
This document outlines the plan for implementing a secure, public-facing portal for church members. Members will access their personal information via expiring short links. To ensure security, access requires a combination of Phone Number validation, SMS OTP verification, and a personal PIN.

Most features will be implemented directly in the frontend app (`church-hub-360`) using Supabase services and query hooks. The `fmt-ss-backend` will only be utilized for operations requiring strict server-side security (e.g., secure token generation or JWT signing).

---

## 1. Database Schema Changes (Supabase)

### `members` table updates
Add the following columns to support PIN authentication:
- `pin_hash` (text, nullable): Stores the securely hashed PIN.
- `pin_setup_at` (timestamptz, nullable): Tracks when the PIN was last set/changed.
- `is_pin_active` (boolean, default: true): Allows admins to lock a member's portal access.

### `short_urls` table updates
Keep this table strictly focused on URL redirection without knowing about members.
- Ensure `expires_at` (timestamptz) exists to support expiring links.
- The `long_url` will contain the necessary secure tokens (e.g., `https://churchhub360.com/#/m/verify?token=XYZ123`).

### `member_access_tokens` table (New)
Since `short_urls` won't know about members, we need a secure way to track the intent of the link.
- `id` (uuid, primary key)
- `member_id` (uuid, foreign key)
- `token` (text, unique): A securely generated random string.
- `purpose` (enum): `PIN_SETUP`, `PIN_RESET`, `VIEW_PROFILE`.
- `expires_at` (timestamptz): Longer for setup, shorter for reset/OTP.
- `is_used` (boolean, default: false).

### `member_otps` table (New)
To manage the SMS OTP flow securely.
- `id` (uuid, primary key)
- `member_id` (uuid, foreign key)
- `otp_code` (text): The 4 or 6 digit code (hashed if preferred).
- `expires_at` (timestamptz): Usually 5-10 minutes.
- `is_used` (boolean, default: false).

---

## 2. Authentication Flow

1. **Link Generation**: Admin generates a link (Setup, Reset, View). System creates a `member_access_tokens` record and a `short_urls` record pointing to `/#/m/verify?token=...`.
2. **Link Click**: Member clicks short link, gets redirected to `/#/m/verify?token=...`.
3. **Phone Verification**: Member sees a masked phone number (e.g., `...567`) and must enter their full phone number.
4. **OTP Dispatch**: If the phone number matches the DB, the system generates an OTP, saves it in `member_otps`, and sends it via the existing SMS integration.
5. **OTP Verification**: Member enters the OTP.
6. **Action Execution**:
    - **PIN Setup/Reset**: Member enters and confirms a new PIN. The token is marked as `is_used`.
    - **Profile View**: Member is granted a temporary session (JWT) to view their profile.
7. **Returning Members**: If a member returns later without a setup link, they can access `/#/m/login`, enter their phone number and PIN to view their profile.

---

## 3. Frontend Implementation (church-hub-360)

### Admin UI Updates (Membership Section)
- Add "Member Access" to the action dropdown in the Membership table.
- Options: **Generate PIN Setup Link**, **Generate PIN Reset Link**, **Generate Profile View Link**.
- **Action Modal**: A dialog allowing the admin to copy the generated short link or send it directly via SMS (reusing patterns from `QuickSmsDialog.tsx`).

### Public Routes (`AppRouter.tsx`)
Create a new set of public routes under `/m/*`:
- `/#/m/verify`: Entry point that extracts the token and starts the verification flow.
- `/#/m/otp`: The OTP entry screen.
- `/#/m/setup-pin`: The PIN creation/reset screen.
- `/#/m/login`: Direct login for returning members (Phone + PIN).
- `/#/m/profile`: The protected profile view (requires member session).

### Services & Hooks
- `useMemberAccess`: Hooks for verifying tokens, validating phone numbers, and verifying OTPs.
- `useMemberAuth`: Hooks for logging in with a PIN and maintaining the member session (separate from Admin auth).

---

## 4. Backend Implementation (fmt-ss-backend)

While most logic lives in the frontend via Supabase, the following might require the `fmt-ss-backend` to ensure security (preventing frontend tampering):
- **Member JWT Generation**: Generating a secure, signed JWT for the member session after successful PIN/OTP login. This ensures the frontend cannot forge a session.
- **Rate Limiting**: Implementing strict rate limiting on OTP generation and Phone Number guesses to prevent brute-force attacks.

*Note: The backend must use the `app_id` configuration specific to church-hub-360.*

---

## 5. Implementation Phases

- **Phase 1**: Database schema updates (Supabase migrations/types) and `fmt-ss-backend` endpoints for session/JWT generation.
- **Phase 2**: Frontend API services, Supabase queries, and React Query hooks for token, OTP, and SMS logic.
- **Phase 3**: Admin UI (Link generation modal and SMS dispatch).
- **Phase 4**: Public Member UI (Routing, Phone entry, OTP entry, PIN setup, Login).
- **Phase 5**: The actual Profile View UI (displaying the member's data securely).
