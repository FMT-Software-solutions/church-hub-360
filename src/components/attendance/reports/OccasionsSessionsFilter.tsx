import { Label } from '@/components/ui/label';
import { OccasionSearchTypeahead } from '@/components/shared/OccasionSearchTypeahead';
import { SessionSearchTypeahead } from '@/components/shared/SessionSearchTypeahead';
import { useOccasionDetails, useSessionDetails } from '@/hooks/attendance/useAttendanceSearch';

export type OccasionSessionMode = 'all' | 'selected';

interface OccasionsSessionsFilterProps {
  mode: OccasionSessionMode;
  onModeChange: (mode: OccasionSessionMode) => void;
  selectedOccasionIds: string[];
  onOccasionsChange: (ids: string[]) => void;
  selectedSessionIds: string[];
  onSessionsChange: (ids: string[]) => void;
  className?: string;
}

export function OccasionsSessionsFilter({
  selectedOccasionIds,
  onOccasionsChange,
  selectedSessionIds,
  onSessionsChange,
  className,
}: OccasionsSessionsFilterProps) {
  const { data: occasionDetails = [] } = useOccasionDetails(selectedOccasionIds);
  const { data: sessionDetails = [] } = useSessionDetails(selectedSessionIds);

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Occasions</Label>
          <OccasionSearchTypeahead
            value={occasionDetails}
            onChange={(items) => {
              const ids = items.map((i) => i.id);
              onOccasionsChange(ids);
              // If occasion selection is cleared, also reset selected sessions
              if (ids.length === 0) {
                onSessionsChange([]);
              }
            }}
            placeholder="All occasions — type to search"
          />
        </div>

        <div className="space-y-2">
          <Label>Sessions</Label>
          <SessionSearchTypeahead
            value={sessionDetails}
            onChange={(items) => onSessionsChange(items.map(i => i.id))}
            placeholder="All sessions — type to search"
            multiSelect
            occasionId={selectedOccasionIds.length === 1 ? selectedOccasionIds[0] : undefined}
          />
        </div>
      </div>
    </div>
  );
}