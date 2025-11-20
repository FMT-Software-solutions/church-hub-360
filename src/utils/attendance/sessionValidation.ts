import type { AttendanceLocation, AttendanceMarkingModes, AttendanceSession } from '@/types/attendance';
import type { MemberSummary } from '@/types/members';

export type MarkingOrigin = 'internal_session_details' | 'internal' | 'public_link';
export type MarkingModeKey = keyof AttendanceMarkingModes;

export interface ValidationContext {
  origin: MarkingOrigin;
  mode?: MarkingModeKey;
  now?: Date;
  memberId?: string;
  memberBranchId?: string | null;
  // Efficient membership checks: pass a Set for O(1) lookups
  allowedMemberIds?: Set<string> | string[];
  // Optional location for proximity validation (public marking)
  location?: AttendanceLocation | null;
}

export interface ValidationChecks {
  isOpen: boolean;
  withinTimeWindow: boolean;
  publicAllowed: boolean;
  modeEnabled: boolean;
  memberAllowed: boolean | 'unknown';
  proximityOk: boolean | 'skipped';
  memberInSessionBranch: boolean | 'unknown';
}

export interface ValidationResult {
  ok: boolean;
  checks: ValidationChecks;
  reasons: string[]; // machine-readable reason codes for failing checks
}

function toSet(ids?: Set<string> | string[] | null): Set<string> | null {
  if (!ids || (Array.isArray(ids) && ids.length === 0)) return null;
  return ids instanceof Set ? ids : new Set(ids);
}

function isWithinTimeWindow(session: Pick<AttendanceSession, 'start_time' | 'end_time'>, now?: Date): boolean {
  const tNow = now ?? new Date();
  const start = new Date(session.start_time);
  const end = new Date(session.end_time);
  return tNow >= start && tNow <= end;
}

function isModeEnabled(marking_modes: AttendanceMarkingModes, mode?: MarkingModeKey): boolean {
  if (!mode) return true; // If no specific mode is requested, do not block on mode
  return !!marking_modes?.[mode];
}

function isPublicAllowed(session: AttendanceSession, origin: MarkingOrigin): boolean {
  if (origin !== 'public_link') return true;
  return !!session.allow_public_marking;
}

function memberIsExplicitlyAllowed(
  session: AttendanceSession,
  memberId: string | undefined,
  allowedMemberIds?: Set<string> | string[] | null
): boolean | 'unknown' {
  // If no memberId provided, we cannot check member-level permissions
  if (!memberId) return 'unknown';

  const hasAnyRestrictions =
    (session.allowed_members && session.allowed_members.length > 0) ||
    (session.allowed_groups && session.allowed_groups.length > 0) ||
    (session.allowed_tags && session.allowed_tags.length > 0);

  // If there are no restrictions, everyone is allowed
  if (!hasAnyRestrictions) return true;

  // If restrictions exist but we were not provided an allowlist set, we cannot decide
  const set = toSet(allowedMemberIds ?? null);
  if (!set) return 'unknown';

  return set.has(memberId);
}

// Haversine distance in meters
function haversineMeters(a: AttendanceLocation, b: AttendanceLocation): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

function proximitySatisfied(session: AttendanceSession, userLocation?: AttendanceLocation | null): boolean | 'skipped' {
  if (!session.proximity_required) return 'skipped';
  if (!session.location || !userLocation) return false;
  const distance = haversineMeters(session.location, userLocation);
  const radius = session.location.radius ?? 100; // default radius if not set
  return distance <= radius;
}

function memberBranchSatisfies(session: AttendanceSession, memberBranchId?: string | null): boolean | 'unknown' {
  if (typeof memberBranchId === 'undefined') return 'unknown';
  if (memberBranchId === null) return false;
  if (session.branch_id === null) return true;
  return memberBranchId === session.branch_id;
}

/**
 * validateSessionForMarking
 * Centralized validator to determine if marking should be allowed in a given context.
 * - Efficient: O(1) checks, optional Set for member allowlist
 * - Clean: small focused checks assembled per origin
 */
export function validateSessionForMarking(
  session: AttendanceSession,
  context: ValidationContext
): ValidationResult {
  const now = context.now ?? new Date();

  const checks: ValidationChecks = {
    isOpen: !!session.is_open,
    withinTimeWindow: isWithinTimeWindow(session, now),
    publicAllowed: isPublicAllowed(session, context.origin),
    modeEnabled: isModeEnabled(session.marking_modes, context.mode),
    memberAllowed: memberIsExplicitlyAllowed(session, context.memberId, context.allowedMemberIds),
    proximityOk: proximitySatisfied(session, context.location ?? null),
    memberInSessionBranch: memberBranchSatisfies(session, context.memberBranchId),
  };

  const reasons: string[] = [];

  // Rules per origin
  if (context.origin === 'public_link') {
    if (!checks.isOpen) reasons.push('session_closed');
    if (!checks.withinTimeWindow) reasons.push('outside_time_window');
    if (!checks.publicAllowed) reasons.push('public_marking_disabled');
    if (!checks.modeEnabled) reasons.push('mode_disabled');
    if (checks.memberAllowed === false) reasons.push('member_not_allowed');
    if (checks.memberAllowed === 'unknown') reasons.push('member_allowlist_unknown');
    if (checks.proximityOk === false) reasons.push('outside_allowed_radius');
    if (checks.memberInSessionBranch === false) reasons.push('member_not_in_session_branch');
    if (checks.memberInSessionBranch === 'unknown') reasons.push('member_branch_unknown');

  } else {
    // internal and internal_session_details
    // Keep internal relaxed: no publicAllowed or proximity checks
    if (!checks.isOpen) reasons.push('session_closed');
    // Time window is a soft requirement; include as reason but allow override by admin (UI can warn)
    if (!checks.withinTimeWindow) reasons.push('outside_time_window');
    if (!checks.modeEnabled) reasons.push('mode_disabled');
    // Member restrictions typically not enforced for admins; still report for awareness
    if (checks.memberAllowed === false) reasons.push('member_not_allowed');
    if (context.memberId) {
      if (checks.memberInSessionBranch === false) {
        if (context.memberBranchId === null) reasons.push('member_branch_unassigned');
        else reasons.push('member_not_in_session_branch');
      }
      // Do not push unknown for internal contexts when memberId not provided
    }
  }

  let ok: boolean;
  if (context.origin === 'public_link') {
    // Strict: all checks must pass
    ok = reasons.length === 0;
  } else if (context.origin === 'internal_session_details') {
    // Admin session details: disallow marking when outside time window
    ok =
      !reasons.includes('session_closed') &&
      !reasons.includes('mode_disabled') &&
      !reasons.includes('outside_time_window') &&
      (!context.memberId || (
        !reasons.includes('member_not_in_session_branch') &&
        !reasons.includes('member_branch_unassigned')
      ));
  } else {
    // Other internal contexts: relaxed (time window warning only)
    ok =
      !reasons.includes('session_closed') &&
      !reasons.includes('mode_disabled') &&
      (!context.memberId || (
        !reasons.includes('member_not_in_session_branch') &&
        !reasons.includes('member_branch_unassigned')
      ));
  }

  return { ok, checks, reasons };
}

/**
 * Convenience helper to create a Set of allowed member IDs from a list of MemberSummary.
 */
export function buildAllowedMemberIdSet(members: MemberSummary[] | undefined | null): Set<string> | null {
  if (!members || members.length === 0) return null;
  const set = new Set<string>();
  for (const m of members) {
    if (m.id) set.add(m.id);
  }
  return set;
}

/**
 * Human-friendly message based on reasons. Keep minimal; UI can translate further.
 */
export function formatValidationMessage(result: ValidationResult): string | null {
  if (result.ok) return null;
  const messages: Record<string, string> = {
    session_closed: 'This session is closed for marking.',
    outside_time_window: 'Marking is outside the scheduled time window.',
    public_marking_disabled: 'Public marking is disabled for this session.',
    mode_disabled: 'Selected marking mode is disabled.',
    member_not_allowed: 'You are not allowed to mark attendance for this session.',
    member_allowlist_unknown: 'Member allowlist not loaded; cannot verify eligibility.',
    outside_allowed_radius: 'You are outside the allowed proximity radius.',
    member_not_in_session_branch: 'Member is not assigned to this session branch.',
    member_branch_unknown: 'Member branch could not be verified.',
    member_branch_unassigned: 'Member is not assigned to any branch.',
  };
  return result.reasons.map(r => messages[r] ?? r).join(' ');
}