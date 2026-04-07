# Self Attendance MVP Implementation Document

## 1. Purpose

This document defines the full MVP implementation plan for self-attendance marking in Church Hub 360.

The goal is to allow members to mark their own attendance through:

- Personal attendance links
- Printed QR codes

The solution must remain simple enough for MVP while still being secure enough to reduce misuse.

This MVP will use:

- Member phone number as the member identity key
- OTP verification for PIN setup and PIN reset (We've already implemented this)
- Confidential member PIN for routine authentication (We've already implemented this)
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
- Avoid full member authentication for this MVP. we are using PINs.
- Reuse the same phone + PIN model for lightweight member self-service

### Secondary goals

- Allow members to view selected personal information using phone + PIN (We've already implemented this)
- Allow members to view their attendance history using phone + PIN (We can do this later)
- Keep admin users unable to see member PINs (Everything about PIN setup is already implemented)


## 3. Core MVP Design

### Identity model

Members do not have full app accounts for this MVP.

Instead, members will authenticate using:

- Phone number
- Their Confidential PIN

### PIN lifecycle

PIN is created or reset only through a secure flow(We've already implemented this): 

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

- QR code flow (When scanned will redirect member to the same page as personal link flow):
Rest of flow is same as personal link flow

### Security model

A member is considered valid for self-attendance only when all required checks pass:

- PIN is valid with their phone number
- Session is valid
- Session is active
- Self-marking is enabled
- Member is eligible
- Member is not already marked
- Location is within allowed radius when proximity is required

Note: Some members phone numbers are stored with country code and some are not. Phone-number matching must succeed whether the stored or entered value includes the country code or not if and only if  the number is correct.

---

## 4. Functional Scope

## 4.1 Member PIN Setup (First-time)

We've already implemented this.

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

We've already implemented this.

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
   - phone number field
   - PIN field
6. Member enters phone number and PIN
7. Browser requests location permission
8. System validates:
   - attendance/session token
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
2. QR contains a personal attendance link to a session 
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
- Member must have a unique usable phone number
- Member must have a configured PIN to use PIN-based flows
- Member must belong to the allowed audience if session restrictions exist

### Attendance rules

- A member can only be marked once per session
- Manual/admin attendance and self-attendance must both respect the same uniqueness rule
- If the member is already marked, self-attendance should return an already-marked result
- Self-attendance must never bypass session eligibility checks


### Phone number rules

- Phone number must be normalized
- Phone numbers used for self-service should be unique
- Members with duplicate/shared phone numbers should be excluded from self-service until a future enhancement is built

---


## Rate Limiting and Lockouts
Because PIN may be 4 digits, we can implement brute-force protection.

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

## Proximity Security

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




## Attendance self-mark audit table
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


### Handle already-marked scenario gracefully

If attendance already exists:

- do not throw a generic failure
- return a clear already-marked message

### Add duplicate race-condition protection

Even if two requests arrive at the same time:

- database uniqueness must block duplicate insertion
- application must return a safe already-marked response

---


## UI and UX Requirements

## General UX principles

- Keep forms very short
- Use mobile-first layout
- Optimize for low-tech users
- Use simple wording
- Make failures understandable
- Avoid exposing internal system terminology



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
