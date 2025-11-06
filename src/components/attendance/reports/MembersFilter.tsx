import { MemberSearchTypeahead } from '@/components/shared/MemberSearchTypeahead';
import { Label } from '@/components/ui/label';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { MemberSearchResult } from '@/hooks/useMemberSearch';
import { useMemberDetails } from '@/hooks/useMemberSearch';
import { useMemo } from 'react';

interface MembersFilterProps {
  memberIds: string[];
  onMemberIdsChange: (ids: string[]) => void;
}

export function MembersFilter({
  memberIds,
  onMemberIdsChange,
}: MembersFilterProps) {
  const { currentOrganization } = useOrganization();
  const { data: details = [] } = useMemberDetails(memberIds);

  const typeaheadValue: MemberSearchResult[] = useMemo(() => {
    return details.map((m) => ({
      ...m,
      display_name: m.full_name || `${m.first_name} ${m.last_name}` || 'Member',
      display_subtitle: m.email || m.phone || '',
    }));
  }, [details]);

  return (
    <div>
      <Label className="mb-2">Members</Label>
      <MemberSearchTypeahead
        organizationId={currentOrganization!.id}
        value={typeaheadValue}
        onChange={(arr: MemberSearchResult[]) =>
          onMemberIdsChange(arr.map((m) => m.id))
        }
        placeholder="Search and select members"
        multiSelect
      />
    </div>
  );
}
