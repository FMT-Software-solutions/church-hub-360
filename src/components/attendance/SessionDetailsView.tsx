import { useOrganization } from '@/contexts/OrganizationContext';
import {
  useMarkAttendance,
  useSessionAllowedMembers,
  useSessionAttendanceRecords,
  useUnmarkAttendance,
} from '@/hooks/attendance/useAttendanceMarking';
import { useMembersSummaryPaginated } from '@/hooks/useMemberQueries';
import { useTagsQuery } from '@/hooks/useRelationalTags';
import type { AttendanceSessionWithRelations } from '@/types/attendance';
import type { MemberSummary } from '@/types/members';
import { useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import {
  validateSessionForMarking,
  buildAllowedMemberIdSet,
} from '@/utils/attendance/sessionValidation';
import {
  LinksQrCard,
  ManualMarkingCard,
  SessionDetailsHeader,
  SessionInfoCard,
} from './session-details';

interface SessionDetailsViewProps {
  session: AttendanceSessionWithRelations;
  onBack: () => void;
}

export function SessionDetailsView({
  session,
  onBack,
}: SessionDetailsViewProps) {
  const { currentOrganization } = useOrganization();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchFields, setSearchFields] = useState<
    ('name' | 'email' | 'phone' | 'membershipId')[]
  >(() => {
    const fields: ('name' | 'email' | 'phone' | 'membershipId')[] = ['name'];
    const modes = session.marking_modes || {};
    if (modes.email) fields.push('email');
    if (modes.phone) fields.push('phone');
    if (modes.membership_id) fields.push('membershipId');
    return fields;
  });

  // Fetch allowed members (union of allowed criteria) if any are specified
  const {
    data: allowedMembers = [],
    isLoading: loadingAllowed,
  } = useSessionAllowedMembers(session);

  const allowedMemberIdSet = useMemo(() => buildAllowedMemberIdSet(allowedMembers), [allowedMembers]);

  // Session-level validation to decide if manual marking UI should show
  const sessionValidation = useMemo(
    () =>
      validateSessionForMarking(session, {
        origin: 'internal_session_details',
        mode: 'manual',
      }),
    [session]
  );

  const reasonLabels: Record<string, string> = {
    session_closed: 'Session closed',
    outside_time_window: 'Outside scheduled time window',
    public_marking_disabled: 'Public marking disabled',
    mode_disabled: 'Manual marking disabled',
    member_not_allowed: 'Member not allowed for this session',
    member_allowlist_unknown: 'Allowlist not loaded',
    outside_allowed_radius: 'Outside allowed proximity radius',
    missing_session: 'No session provided',
  };

  // Fallback to all members when no allowed list
  const { data: paginated, isLoading: loadingAll } = useMembersSummaryPaginated(
    currentOrganization?.id,
    { search },
    page,
    pageSize,
    null
  );

  // Attendance records for present state
  const { data: records = [] } = useSessionAttendanceRecords(session.id);
  const markAttendance = useMarkAttendance();
  const unmarkAttendance = useUnmarkAttendance();

  // Tag names for displaying allowed tags
  const { data: orgTags = [] } = useTagsQuery(currentOrganization?.id);
  const allowedTagLabels = useMemo(() => {
    const byId = new Map<string, string>();
    orgTags.forEach((tag) =>
      tag.tag_items.forEach((item) => byId.set(item.id, item.name))
    );
    return (session.allowed_tags || []).map((id) => byId.get(id) || id);
  }, [orgTags, session.allowed_tags]);

  // Resolve the list to display
  const baseMembers: MemberSummary[] = useMemo(() => {
    if (allowedMembers.length > 0) return allowedMembers;
    return paginated?.members || [];
  }, [allowedMembers, paginated]);

  // Client-side filtering by search term and fields
  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return baseMembers;
    return baseMembers.filter((member) => {
      const pool: string[] = [];
      if (searchFields.includes('name')) {
        pool.push(
          (
            member.full_name ||
            `${member.first_name} ${member.last_name}` ||
            ''
          ).toLowerCase()
        );
      }
      if (searchFields.includes('email'))
        pool.push((member.email || '').toLowerCase());
      if (searchFields.includes('phone'))
        pool.push((member.phone || '').toLowerCase());
      if (searchFields.includes('membershipId'))
        pool.push((member.membership_id || '').toLowerCase());
      return pool.some((val) => val.includes(term));
    });
  }, [baseMembers, search, searchFields]);

  const presentMap = useMemo(() => {
    const map = new Map<string, boolean>();
    records.forEach((r) => {
      map.set(r.member_id, true);
    });
    return map;
  }, [records]);

  const handlePresent = async (memberId: string) => {
    const validation = validateSessionForMarking(session, {
      origin: 'internal_session_details',
      mode: 'manual',
      memberId,
      allowedMemberIds: allowedMemberIdSet ?? undefined,
    });
    if (!validation.ok) {
      // Block marking when validation fails (e.g., session closed, mode disabled, member not allowed)
      console.warn('Marking prevented:', validation.reasons);
      return;
    }
    await markAttendance.mutateAsync({ sessionId: session.id, memberId });
  };

  const handleAbsent = async (memberId: string) => {
    const validation = validateSessionForMarking(session, {
      origin: 'internal_session_details',
      mode: 'manual',
      memberId,
      allowedMemberIds: allowedMemberIdSet ?? undefined,
    });
    if (!validation.ok) {
      console.warn('Unmark prevented:', validation.reasons);
      return;
    }
    await unmarkAttendance.mutateAsync({ sessionId: session.id, memberId });
  };

  return (
    <div className="space-y-6">
      {/* Header / Back */}
      <SessionDetailsHeader session={session} onBack={onBack} />

      {/* Details + Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details and manual marking */}
        <div className="lg:col-span-2 space-y-6">
          {/* Session info */}
          <SessionInfoCard
            session={session}
            allowedTagLabels={allowedTagLabels}
          />

          {/* Status alert when marking is not available */}
          {!sessionValidation.ok && (
            <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/10">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Attendance Marking Unavailable</AlertTitle>
              <AlertDescription>
                Attendance marking is currently disabled for this session.
              </AlertDescription>
              <div className="mt-3 flex flex-wrap gap-2">
                {sessionValidation.reasons.map((r) => (
                  <Badge key={r} variant="secondary" className="text-xs">
                    {reasonLabels[r] ?? r}
                  </Badge>
                ))}
              </div>
            </Alert>
          )}

          {/* Manual marking table */}
          {sessionValidation.ok && (
            <ManualMarkingCard
              session={session}
              search={search}
              setSearch={setSearch}
              searchFields={searchFields}
              setSearchFields={setSearchFields}
              filteredMembers={filteredMembers}
              presentMap={presentMap}
              onPresent={handlePresent}
              onAbsent={handleAbsent}
              markPending={markAttendance.isPending}
              unmarkPending={unmarkAttendance.isPending}
              hasAllowedList={allowedMembers.length > 0}
              loadingAllowed={loadingAllowed}
              loadingAll={loadingAll}
              page={page}
              pageSize={pageSize}
              paginatedTotal={(paginated?.total || 0) as number}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              markingModes={session.marking_modes}
              records={records}
            />
          )}
        </div>

        {/* Right: Link/QR placeholders */}
        <div className="space-y-6">
          <LinksQrCard />
        </div>
      </div>
    </div>
  );
}
