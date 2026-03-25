# Self Attendance MVP Implementation Document

## 1. Purpose

This document defines the full MVP implementation plan for self-attendance in Church Hub 360.

The goal is to allow members to mark their own attendance through:

- Personal attendance links
- Printed QR codes

The solution must remain simple enough for MVP while still being secure enough to reduce misuse.

This MVP will use:

- Member phone number as the member identity key
- OTP verification for PIN setup and PIN reset
- Confidential member PIN for routine authentication
- Proximity validation for physical presence checks
- Session validation and duplicate prevention for attendance integrity

This document is written so implementation can begin later after SMS integration is ready.

---

## 2. MVP Goals

### Primary goals

- Allow members to mark their own attendance
- Support personal attendance links
- Support QR-code attendance marking
- Require physical presence when proximity is enabled
- Prevent duplicate marking
- Prevent simple impersonation using only names or phone numbers
- Avoid full member authentication for this MVP
- Reuse the same phone + PIN model later for lightweight member self-service

### Secondary goals

- Allow members to view selected personal information using phone + PIN
- Allow members to view their attendance history using phone + PIN
- Keep admin users unable to see member PINs
- Keep the architecture ready for SMS integration

### Non-goals for MVP

- Full member login system
- Device fingerprinting as primary security
- Biometric authentication
- Bulk SMS implementation
- Visitor self-attendance
- Family/shared-phone complex flows
- Offline attendance marking
- Anti-spoofing guarantees against advanced fake GPS tools

---

## 3. Core MVP Design

### Identity model

Members do not have full app accounts for this MVP.

Instead, members will authenticate using:

- Phone number
- Confidential PIN

### PIN lifecycle

PIN is created or reset only through a secure flow:

- Admin generates a time-bound setup or reset link
- Link is sent to the member by SMS
- Member confirms phone number
- OTP is sent to the same phone number
- Member verifies OTP
- Member creates a PIN

### Attendance authentication model

- Personal link flow:

  - Link identifies the session and the intended member
  - Member enters PIN
  - System validates PIN and session rules
  - System validates proximity if required
  - Attendance is marked

- QR code flow:
  - QR identifies the session only
  - Member enters phone number and PIN
  - System resolves the member
  - System validates PIN and session rules
  - System validates proximity if required
  - Attendance is marked

### Security model

A member is considered valid for self-attendance only when all required checks pass:

- Session is valid
- Session is active
- Self-marking is enabled
- Member is eligible
- Member is not already marked
- PIN is valid
- Location is within allowed radius when proximity is required

---

## 4. Functional Scope

## 4.1 Member PIN Setup

The system must support first-time member PIN setup.

### Flow

1. Admin generates a member PIN setup link
2. Link is tied to a specific member
3. Link has an expiry time
4. Link is single-use
5. Member opens the link
6. Member enters or confirms phone number
7. System checks that the phone matches the member on the link
8. System sends OTP to that phone
9. Member enters OTP
10. System validates OTP
11. Member sets PIN
12. System stores hashed PIN
13. Setup token becomes invalid immediately
14. Member sees success confirmation

---

## 4.2 Member PIN Reset

The system must support PIN reset without full member login.

### Flow

1. Admin generates a member PIN reset link
2. Link is tied to a specific member
3. Link has a short expiry time
4. Link is single-use
5. Member opens the link
6. Member enters or confirms phone number
7. System checks that the phone matches the member on the link
8. System sends OTP to that phone
9. Member enters OTP
10. System validates OTP
11. Member sets new PIN
12. System replaces old hashed PIN
13. Reset token becomes invalid immediately
14. Member sees success confirmation

---

## 4.3 Personal Attendance Link

The system must support personalized attendance links for specific members.

### Flow

1. Admin generates attendance links for a session
2. Each link is tied to:
   - session
   - member
   - expiry
3. Link is shared with member through SMS or WhatsApp
4. Member opens the link
5. Page shows:
   - member name
   - masked phone number
   - PIN field
6. Member enters PIN
7. Browser requests location permission
8. System validates:
   - attendance token
   - member identity
   - valid PIN
   - session active
   - self-attendance enabled
   - member eligible for session
   - member not already marked
   - distance within proximity when required
9. Attendance is created
10. Member sees success response

---

## 4.4 QR Attendance

The system must support printed QR-based attendance.

### Flow

1. Admin generates QR code for a session
2. QR contains a signed session token or short session reference
3. QR is printed and placed at church premises
4. Member scans QR
5. Page opens asking for:
   - phone number
   - PIN
6. Browser requests location permission
7. System validates:
   - session token
   - phone number
   - member PIN
   - session active
   - self-attendance enabled
   - member eligible
   - member not already marked
   - distance within proximity when required
8. Attendance is created
9. Member sees success response

---

## 4.5 Member Self-Service Access

The same phone + PIN model may be used for basic member self-service pages.

### MVP allowed read-only features

- View selected membership details
- View personal attendance history

### Important rule

Only expose low-risk personal information in MVP.

Do not expose highly sensitive data unless reviewed first.

---

## 5. Business Rules

### Session rules

- A session may enable or disable self-attendance
- A session may enable or disable proximity validation
- A session must have active/inactive state
- A session must have attendance window rules
- A session may have branch or audience restrictions

### Member rules

- Only active members should use self-service attendance
- Member must have a unique usable phone number for MVP
- Member must have a configured PIN to use PIN-based flows
- Member must belong to the allowed audience if session restrictions exist

### Attendance rules

- A member can only be marked once per session
- Manual/admin attendance and self-attendance must both respect the same uniqueness rule
- If the member is already marked, self-attendance should return an already-marked result
- Self-attendance must never bypass session eligibility checks

### PIN rules

- PIN must never be stored in plain text
- PIN must be hashed with a secure one-way algorithm
- PIN reset must require OTP
- PIN verification attempts must be rate limited
- Repeated failed attempts must trigger temporary lock

### Phone number rules

- Phone number must be normalized to one standard format
- Phone numbers used for self-service should be unique in MVP
- Members with duplicate/shared phone numbers should be excluded from self-service until a future enhancement is built

---

## 6. Security Requirements

## 6.1 PIN Storage

PIN must be stored as a hash only.

### Required behavior

- Never store raw PIN
- Never display PIN to admins
- Never log PIN in requests, responses, or audit logs
- Use a secure password-hashing algorithm
- Store metadata such as:
  - pinSetAt
  - pinResetAt
  - failedPinAttempts
  - lockUntil

### Outcome

Admins can manage setup/reset flows without ever knowing the member PIN.

---

## 6.2 Tokens

All public links must use signed, expiring, purpose-specific tokens.

### Token purposes

- pin_setup
- pin_reset
- attendance_link

### Token requirements

- signed by server
- includes token purpose
- includes member ID when applicable
- includes session ID when applicable
- includes expiry time
- includes unique token ID or nonce
- single-use where required

### Single-use requirement

Single-use is mandatory for:

- pin setup link
- pin reset link

Optional for attendance links, but expiry is still required.

---

## 6.3 OTP

OTP is used only for setup/reset identity proofing.

### OTP requirements

- short expiry
- limited attempts
- invalidated after success
- tied to member and purpose
- tied to phone number being verified

### MVP note

Attendance marking should not require OTP every time.

OTP is only for:

- initial PIN setup
- PIN reset

---

## 6.4 Rate Limiting and Lockouts

Because PIN may be 4 digits, brute-force protection is mandatory.

### Recommended MVP rules

- Maximum 5 failed PIN attempts
- Lock member self-service for 15 minutes after 5 failures
- Apply IP-based throttling
- Apply session-based throttling on public attendance endpoints
- Log suspicious repeated failures

### Do not reveal

Error messages must not clearly reveal whether:

- phone exists
- token is valid for a real member
- PIN was almost correct

Use generic failure messages where possible.

---

## 6.5 Proximity Security

Proximity is a presence check, not an identity check.

### Required behavior

- Always validate location on the server after receiving client coordinates
- Require browser location permission
- Capture and validate reported accuracy
- Reject location when accuracy is too poor
- Compute distance from configured church/session coordinates
- Allow attendance only when within allowed radius

### Important note

Proximity reduces simple fraud but does not guarantee perfect protection against advanced fake-location tools.

That is acceptable for MVP.

---

## 7. Data Model Changes

The exact table names should follow the existing project conventions.

## 7.1 Member fields

Add fields to support PIN-based member access.

### Suggested fields

- phoneNormalized
- isPhoneVerifiedForSelfService
- pinHash
- pinSetAt
- pinResetAt
- failedPinAttempts
- pinLockedUntil
- selfServiceEnabled
- selfServiceLastAccessAt

### Notes

- `phoneNormalized` should be the canonical phone value used for lookup
- `selfServiceEnabled` allows enabling the feature only for qualified members
- If the current member schema already contains related fields, extend rather than duplicate

---

## 7.2 Self-service token table

Create a token table for PIN setup and reset links.

### Suggested fields

- id
- memberId
- purpose
- tokenHash or tokenId
- expiresAt
- usedAt
- createdBy
- createdAt
- metadata

### Purpose values

- pin_setup
- pin_reset

### Important notes

- Prefer storing hashed token reference rather than raw token
- Token usage must be auditable

---

## 7.3 OTP table

Create or extend an OTP table.

### Suggested fields

- id
- memberId
- phoneNormalized
- purpose
- codeHash
- expiresAt
- usedAt
- attempts
- createdAt
- metadata

### Purpose values

- pin_setup
- pin_reset

---

## 7.4 Attendance self-mark audit table

Create a dedicated audit table for self-attendance attempts.

### Suggested fields

- id
- sessionId
- memberId
- source
- status
- failureReason
- submittedLatitude
- submittedLongitude
- submittedAccuracy
- distanceMeters
- ipHash
- userAgent
- deviceHash
- tokenId
- createdAt

### Source values

- personal_link
- qr_code

### Status values

- success
- failed

### Failure reason examples

- invalid_token
- expired_token
- invalid_phone
- invalid_pin
- pin_locked
- otp_required
- session_inactive
- self_mark_disabled
- already_marked
- member_not_eligible
- proximity_required
- location_denied
- poor_accuracy
- outside_radius

---

## 7.5 Attendance uniqueness

Ensure the attendance table has a uniqueness rule preventing duplicates.

### Required uniqueness

- unique(sessionId, memberId)

This must be enforced at database level, not only in application logic.

---

## 8. Session Configuration Requirements

Each attendance session should support the following fields if not already available.

### Required fields

- selfMarkEnabled
- selfMarkStartAt
- selfMarkEndAt
- proximityRequired
- locationLatitude
- locationLongitude
- allowedRadiusMeters
- maxAcceptedAccuracyMeters
- activeStatus

### Optional future fields

- gracePeriodBeforeMinutes
- gracePeriodAfterMinutes
- branchRestriction
- groupRestriction
- ministryRestriction

---

## 9. SMS Integration Preparation

SMS is not yet implemented, but the design must be ready for it.

## 9.1 SMS use cases

- Send PIN setup link
- Send PIN reset link
- Send OTP
- Send attendance personal link

## 9.2 Outbound message architecture

Do not hard-code SMS logic directly into controllers.

Instead, prepare service boundaries like:

- token generation service
- OTP service
- notification preparation service
- SMS provider adapter

This allows plugging in SMS later without changing business logic.

## 9.3 Message template planning

Prepare templates for:

- PIN setup invitation
- PIN reset instruction
- OTP code delivery
- personal attendance link

Each template should include:

- church name
- action purpose
- expiry note
- short instructions
- support note if needed

---

## 10. Step-by-Step Implementation Plan

## Phase 1: Foundations

### Step 1: Review existing data structures

Confirm the current schema for:

- members
- attendance sessions
- attendance records
- audit logs
- phone fields
- branch/group relations

### Step 2: Normalize phone-number strategy

Define one canonical format for phone numbers.

Implementation rules:

- Normalize on save
- Normalize on lookup
- Normalize before OTP sending
- Normalize before PIN validation

### Step 3: Identify duplicate/shared phone records

Produce a report of members with:

- missing phone numbers
- duplicate normalized phone numbers
- invalid phone number formats

### Step 4: Define MVP eligibility for self-service

Only enable self-service for members who meet all criteria:

- active member
- valid phone number
- unique normalized phone number
- phone usable for OTP
- not blocked from self-service

---

## Phase 2: Data Layer

### Step 5: Add member self-service fields

Add the member fields listed in section 7.1.

### Step 6: Create self-service token table

Add token storage for PIN setup and PIN reset flows.

### Step 7: Create OTP table

Add OTP storage with expiry, attempts, and used state.

### Step 8: Create self-attendance audit table

Track all self-attendance attempts and outcomes.

### Step 9: Enforce attendance uniqueness

Add a database unique constraint on session and member.

---

## Phase 3: Core Domain Services

### Step 10: Build phone normalization utility

This utility must be reusable by:

- member save flows
- setup/reset validation
- attendance authentication
- self-service access

### Step 11: Build token generation and validation service

This service must support:

- generating signed tokens
- validating expiry
- validating purpose
- resolving member/session reference
- marking single-use tokens as used

### Step 12: Build OTP service

This service must support:

- generating OTP
- hashing OTP
- storing OTP request
- validating OTP
- limiting attempts
- marking OTP as used

### Step 13: Build PIN hashing and verification service

This service must support:

- hashing a PIN
- verifying entered PIN
- tracking failed attempts
- setting lockout period
- resetting failure counters after success

### Step 14: Build geolocation validation service

This service must support:

- validating required coordinate presence
- validating accuracy threshold
- computing distance from configured session location
- returning structured pass/fail reasons

### Step 15: Build member self-service eligibility service

This service must confirm:

- member exists
- self-service is enabled
- phone is valid
- phone is unique for MVP
- member can use the requested feature

### Step 16: Build attendance self-mark validation service

This service must centralize all attendance checks:

- session exists
- session active
- self-mark enabled
- within self-mark window
- member eligible
- not already marked
- proximity valid if required
- token valid if personal link flow

---

## Phase 4: Admin Features

### Step 17: Add admin action for generating PIN setup link

Admin should be able to generate a setup link for a specific member.

Required behavior:

- only authorized roles can generate
- token purpose must be pin_setup
- token must expire
- token must be single-use
- action must be audited

### Step 18: Add admin action for generating PIN reset link

Same as setup, but purpose is pin_reset.

Recommended difference:

- reset links should have shorter expiry than setup links

### Step 19: Add admin action for generating personal attendance links

Admin should be able to generate member-specific attendance links for a session.

Required behavior:

- member-specific signed token
- expiry aligned to attendance window
- optional batch generation later
- action audited

### Step 20: Add admin action for generating session QR code

Admin should be able to generate a session-level QR code.

Required behavior:

- QR should identify session only
- no member-specific identity in QR
- expiry aligned to session window
- QR generation action audited

### Step 21: Add admin session configuration UI

Admin should be able to configure for each session:

- self-mark enabled
- self-mark start/end time
- proximity required
- location coordinates
- allowed radius
- max accepted accuracy

---

## Phase 5: Member PIN Flows

### Step 22: Implement PIN setup page

Page must support:

- token validation
- phone entry or confirmation
- OTP request
- OTP verification
- PIN creation
- success/failure states

### Step 23: Implement PIN reset page

Page must support the same flow as setup, but for reset tokens.

### Step 24: Add member-facing validation messages

Messages should be clear but not overly revealing.

Examples:

- Link expired
- Link already used
- Phone number could not be verified
- OTP invalid or expired
- PIN created successfully
- PIN reset successfully

### Step 25: Enforce PIN rules

For MVP, decide one of:

- exactly 4 digits
- 4 to 6 digits
- exactly 6 digits

Recommended MVP option:

- exactly 4 digits only if lockout rules are strictly enforced

Preferred safer option:

- exactly 6 digits

---

## Phase 6: Attendance Flows

### Step 26: Implement personal attendance page

The page should:

- validate token
- display member name
- display masked phone
- collect PIN
- request location
- submit attendance request
- show clear result

### Step 27: Implement QR attendance page

The page should:

- validate session token
- collect phone number
- collect PIN
- request location
- submit attendance request
- show clear result

### Step 28: Implement attendance marking endpoint

This endpoint should:

- accept session context
- resolve member
- verify PIN
- validate session rules
- validate proximity
- insert attendance atomically
- write audit record
- return success or structured failure response

### Step 29: Handle already-marked scenario gracefully

If attendance already exists:

- do not throw a generic failure
- return a clear already-marked message

### Step 30: Add duplicate race-condition protection

Even if two requests arrive at the same time:

- database uniqueness must block duplicate insertion
- application must return a safe already-marked response

---

## Phase 7: Member Self-Service Read Access

### Step 31: Add lightweight member verification endpoint

Use:

- phone + PIN

This endpoint should create a short-lived member self-service session or temporary access token.

### Step 32: Add membership detail page

Allow members to view approved profile details only.

### Step 33: Add attendance history page

Allow members to view their attendance records.

### Step 34: Restrict sensitive data exposure

Do not expose fields unless intentionally approved.

Examples to review carefully before showing:

- internal notes
- financial details
- admin-only status flags
- disciplinary information
- private leadership remarks

---

## Phase 8: Hardening

### Step 35: Add PIN rate limiting

Apply limits per:

- member
- IP
- endpoint
- time window

### Step 36: Add temporary lockouts

Recommended MVP behavior:

- after 5 failed attempts, lock member PIN access for 15 minutes

### Step 37: Add audit log coverage

Audit at minimum:

- setup link generation
- reset link generation
- OTP sent
- OTP verified
- PIN set/reset
- attendance self-mark success
- attendance self-mark failure
- QR generation
- personal link generation

### Step 38: Add generic failure responses where needed

Do not leak unnecessary validation details to public endpoints.

### Step 39: Add monitoring metrics

Track:

- PIN setup success rate
- PIN reset success rate
- OTP failure rate
- invalid PIN attempts
- location-denied rate
- outside-radius failures
- already-marked frequency

---

## 11. Validation Rules By Flow

## 11.1 PIN Setup Validation

- token exists
- token purpose is pin_setup
- token not expired
- token not used
- member exists
- entered phone matches member phone
- OTP sent to matching phone
- OTP valid
- PIN meets format rules

## 11.2 PIN Reset Validation

- token exists
- token purpose is pin_reset
- token not expired
- token not used
- member exists
- entered phone matches member phone
- OTP valid
- PIN meets format rules

## 11.3 Personal Attendance Validation

- attendance token valid
- attendance token not expired
- token member matches resolved member
- token session matches session
- member PIN valid
- member not locked out
- session active
- self-mark enabled
- self-mark window open
- member eligible
- member not already marked
- location permission granted
- location coordinates present
- accuracy acceptable
- within allowed radius if required

## 11.4 QR Attendance Validation

- QR session token valid
- session active
- self-mark enabled
- self-mark window open
- phone resolves exactly one eligible member
- member PIN valid
- member not locked out
- member eligible
- member not already marked
- location permission granted
- location coordinates present
- accuracy acceptable
- within allowed radius if required

---

## 12. UI and UX Requirements

## 12.1 General UX principles

- Keep forms very short
- Use mobile-first layout
- Optimize for low-tech users
- Use simple wording
- Make failures understandable
- Avoid exposing internal system terminology

## 12.2 PIN setup/reset screens

Must include:

- member identity confirmation
- masked phone display
- OTP input
- PIN entry
- PIN confirmation
- expiry/failure states

## 12.3 Personal attendance screen

Must include:

- church/session information
- member name
- masked phone
- PIN input
- location permission prompt
- clear success state
- already-marked state
- outside-radius state
- session-closed state

## 12.4 QR attendance screen

Must include:

- church/session information
- phone input
- PIN input
- location permission prompt
- same result states as personal attendance

## 12.5 Accessibility considerations

- large tap targets
- visible labels
- readable contrast
- clear validation states
- avoid overly technical language

---

## 13. Edge Cases and Required Handling

## 13.1 Duplicate/shared phone numbers

MVP rule:

- If one phone maps to multiple members, self-service should be blocked for that phone until resolved

## 13.2 Missing phone number

- Member cannot use self-service
- Admin/manual attendance remains available

## 13.3 Wrong phone on file

- Admin updates phone after offline verification
- New setup/reset link is generated

## 13.4 Expired link

- Show expired state
- Require admin to generate a new link

## 13.5 Used link reopened

- Show already-used state
- Do not allow reuse

## 13.6 OTP expired

- Allow resend with throttling

## 13.7 PIN forgotten

- Admin generates reset link
- Same secure flow is reused

## 13.8 Session inactive or closed

- Return session unavailable message
- Do not allow marking

## 13.9 Already marked

- Return success-like informational response
- Do not create a duplicate

## 13.10 Location permission denied

- Show message that location is required when proximity is enabled

## 13.11 Poor GPS accuracy

- Ask member to retry and move to an open area if possible

## 13.12 Outside allowed radius

- Show clear proximity error
- Do not allow marking

## 13.13 Admin marks attendance manually first

- Self-mark should return already marked

## 13.14 Link forwarded to another person

- Personal link still requires the member PIN
- Forwarded link alone is insufficient

## 13.15 Someone knows another member's phone number

- Phone number alone is insufficient
- PIN is also required

## 13.16 Someone knows another member's PIN

- Fraud is still possible if the secret is shared
- This is an accepted MVP limitation
- Communicate clearly that PIN must remain confidential

## 13.17 Poor network

- Support retry behavior
- Avoid duplicate submissions by using idempotent handling where possible

---

## 14. Audit and Compliance Requirements

Each sensitive action must be traceable.

### Audit events

- admin generated setup link
- admin generated reset link
- admin generated personal attendance link
- admin generated session QR
- OTP requested
- OTP verified
- PIN created
- PIN reset
- self-attendance succeeded
- self-attendance failed
- self-service view access succeeded
- self-service view access failed

### Audit metadata

- actor ID where applicable
- member ID
- session ID where applicable
- action type
- timestamp
- request source
- IP or IP hash
- user-agent

---

## 15. API and Service Planning

Exact route names should follow the existing backend conventions.

### Admin APIs

- generate PIN setup link
- generate PIN reset link
- generate personal attendance link
- generate attendance QR
- configure session self-attendance settings

### Public/member APIs

- validate setup/reset token
- send OTP
- verify OTP
- set PIN
- reset PIN
- verify phone + PIN
- mark attendance via personal link
- mark attendance via QR
- fetch member profile summary
- fetch member attendance history

### Service boundaries

- member self-service service
- token service
- OTP service
- PIN service
- attendance self-mark service
- location validation service
- notification service

---

## 16. Recommended Response States

Standardize response states for frontend reliability.

### Setup/reset

- token_invalid
- token_expired
- token_used
- phone_mismatch
- otp_sent
- otp_invalid
- otp_expired
- pin_set_success
- pin_reset_success

### Attendance

- success
- already_marked
- invalid_credentials
- pin_locked
- session_inactive
- self_mark_disabled
- session_closed
- member_not_eligible
- location_required
- location_accuracy_low
- outside_radius
- unexpected_error

---

## 17. Testing Checklist

## 17.1 PIN setup tests

- valid setup flow
- expired setup token
- reused setup token
- wrong phone entered
- OTP invalid
- OTP expired
- successful PIN creation
- PIN hash stored correctly

## 17.2 PIN reset tests

- valid reset flow
- expired reset token
- wrong phone
- OTP failures
- new PIN replaces old PIN
- old PIN no longer works

## 17.3 Personal attendance tests

- valid token and valid PIN
- invalid PIN
- locked PIN
- session inactive
- self-mark disabled
- already marked
- member not eligible
- proximity disabled session
- proximity enabled and within radius
- outside radius
- poor accuracy
- denied location

## 17.4 QR attendance tests

- valid phone + PIN
- unknown phone
- duplicate/shared phone
- invalid PIN
- already marked
- session inactive
- self-mark disabled
- within radius
- outside radius

## 17.5 Security tests

- brute-force PIN attempts
- token replay
- OTP replay
- duplicate concurrent submissions
- public error message leakage
- logs not exposing PIN or OTP

---

## 18. Rollout Strategy

## Stage 1

Enable only:

- admin link generation
- PIN setup/reset
- personal attendance link
- QR attendance
- proximity validation
- audit logs

## Stage 2

Enable:

- member profile self-view
- attendance history self-view

## Stage 3

Add later if needed:

- bulk SMS
- trusted-device experience
- family/shared-phone handling
- full member authentication

---

## 19. MVP Limitations To Accept Intentionally

These limitations are acceptable for the first version.

- No full member login system
- No support for shared phone numbers in self-service
- No visitor self-attendance
- No perfect protection against deliberate PIN sharing
- No perfect protection against advanced fake-GPS abuse
- No self-service for members with missing or invalid phones
- No fully automated PIN reset request without admin involvement

---

## 20. Final MVP Recommendation

Implement the MVP with the following final rules:

- Members use phone + PIN for self-service actions
- PIN is created or reset only through expiring single-use admin-generated links
- OTP is required only for setup and reset
- Personal attendance links require PIN
- QR attendance requires phone + PIN
- Proximity validation is applied when enabled on the session
- Attendance can only be marked once per member per session
- All sensitive actions are audited
- PINs are hashed and never visible to admins
- Self-service is enabled only for members with unique valid phone numbers

This gives a practical MVP that is:

- simple
- secure enough
- easy to explain to members
- extensible for future development

---

## 21. Implementation Readiness Checklist

Implementation should only begin after the following are confirmed:

- phone normalization strategy approved
- duplicate phone policy approved
- PIN length decision approved
- OTP provider integration approach approved
- attendance session settings model approved
- self-service member eligibility rules approved
- audit requirements approved
- admin roles for link generation approved

When all items above are confirmed, development can begin in the phase order defined in this document.
