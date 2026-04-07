import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Settings, MapPin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BranchSelector } from '@/components/shared/BranchSelector';
import { TagMultiCheckboxRenderer } from '@/components/people/tags/TagMultiCheckboxRenderer';
import { GroupsRenderer, type GroupAssignment } from '@/components/people/groups/GroupsRenderer';
import { MemberSearchTypeahead } from '@/components/shared/MemberSearchTypeahead';
import { LocationPicker } from '@/components/shared/LocationPicker';
import { useAttendanceLocations } from '@/hooks/attendance/useAttendanceLocations';
import type { AttendanceMarkingModes, AttendanceLocation } from '@/types/attendance';
import type { RelationalTagWithItems } from '@/hooks/useRelationalTags';
import type { Group } from '@/hooks/useGroups';

interface GlobalSettingsStepProps {
  baseName: string;
  onChangeBaseName: (v: string) => void;
  isOpen: boolean;
  onChangeIsOpen: (v: boolean) => void;
  globalStartISO: string;
  onChangeGlobalStartISO: (v: string) => void;
  globalEndISO: string;
  onChangeGlobalEndISO: (v: string) => void;
  showBranchSelector?: boolean;
  branchId?: string;
  onChangeBranchId?: (id: string | undefined) => void;
  tags: RelationalTagWithItems[];
  // Per-tag values: always multi-select for attendance settings
  allowedTagsByTag: Record<string, string[]>;
  onChangeAllowedTagForTag: (tagId: string, v: string[]) => void;
  groups: Group[];
  allowedGroups: GroupAssignment[];
  onChangeAllowedGroups: (v: GroupAssignment[]) => void;
  organizationId?: string;
  allowedMembers: any[]; // MemberSearchResult[] but avoid import cycle
  onChangeAllowedMembers: (v: any[]) => void;
  markingModes: AttendanceMarkingModes;
  onChangeMarkingModes: (v: AttendanceMarkingModes) => void;
  allowPublicMarking: boolean;
  onChangeAllowPublicMarking: (v: boolean) => void;
  locationId: string | null;
  onChangeLocationId: (v: string | null) => void;
  location?: AttendanceLocation;
  onChangeLocation: (loc?: AttendanceLocation) => void;
}

export function GlobalSettingsStep({
  baseName,
  onChangeBaseName,
  isOpen,
  onChangeIsOpen,
  globalStartISO,
  onChangeGlobalStartISO,
  globalEndISO,
  onChangeGlobalEndISO,
  tags,
  allowedTagsByTag,
  onChangeAllowedTagForTag,
  groups,
  allowedGroups,
  onChangeAllowedGroups,
  showBranchSelector,
  branchId,
  onChangeBranchId,
  organizationId,
  allowedMembers,
  onChangeAllowedMembers,
  markingModes,
  onChangeMarkingModes,
  allowPublicMarking,
  onChangeAllowPublicMarking,
  locationId,
  onChangeLocationId,
  location,
  onChangeLocation,
}: GlobalSettingsStepProps) {
  const startTime = new Date(globalStartISO).toTimeString().split(' ')[0].slice(0, 5);
  const endTime = new Date(globalEndISO).toTimeString().split(' ')[0].slice(0, 5);
  const { data: attendanceLocations = [] } = useAttendanceLocations();

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-4 w-4" /> Global Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Base Name</Label>
              <Input value={baseName} onChange={(e) => onChangeBaseName(e.target.value)} placeholder="Optional base name" />
              <p className="text-xs text-muted-foreground">Will append the date automatically</p>
            </div>
          </div>

          {showBranchSelector && (
            <div className="space-y-2">
              <Label>Branch (Optional)</Label>
              <BranchSelector
                variant="single"
                value={branchId}
                onValueChange={(v) => (onChangeBranchId ? onChangeBranchId(v as string | undefined) : undefined)}
                allowClear
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                step="60"
                value={startTime}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(':').map(Number);
                  const base = new Date(globalStartISO);
                  const updated = new Date(base);
                  updated.setHours(h ?? 0, m ?? 0, 0, 0);
                  onChangeGlobalStartISO(updated.toISOString());

                  // Automatically adjust end time if it's now before the new start time
                  const endBase = new Date(globalEndISO);
                  if (updated > endBase) {
                    const newEnd = new Date(updated);
                    newEnd.setHours(newEnd.getHours() + 2);
                    onChangeGlobalEndISO(newEnd.toISOString());
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                step="60"
                value={endTime}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(':').map(Number);
                  const base = new Date(globalEndISO);
                  const updated = new Date(base);
                  updated.setHours(h ?? 0, m ?? 0, 0, 0);

                  // Ensure end time is not before start time
                  const startBase = new Date(globalStartISO);
                  const startHours = startBase.getHours();
                  const startMinutes = startBase.getMinutes();

                  if (h < startHours || (h === startHours && m < startMinutes)) {
                    // If invalid, default to 2 hours after start time
                    updated.setHours(startHours + 2, startMinutes, 0, 0);
                  }

                  onChangeGlobalEndISO(updated.toISOString());
                }}
              />
            </div>
          </div>


          {/* Allowed Tags */}
          {tags.length > 0 && (
            <div className="space-y-2 my-12">
              <Label>Allowed Tags (Optional)</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Restrict attendance to members with specific tags
              </p>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {tags.map((tag: RelationalTagWithItems) => (
                  <div key={tag.id} className="space-y-2 border border-border p-4 rounded-md">
                    <TagMultiCheckboxRenderer
                      tag={tag}
                      tagKey={tag.id}
                      value={allowedTagsByTag[tag.id] ?? []}
                      onChange={(val) => onChangeAllowedTagForTag(tag.id, val)}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className='pace-y-6 mt-12'>
            {/* Allowed Groups */}
            <div className="space-y-2 mb-6">
              <Label className='mb-4'>Allowed Groups (Optional)</Label>
              <GroupsRenderer
                groups={groups}
                value={allowedGroups}
                onChange={onChangeAllowedGroups}
                allowPositions={false}
              />
            </div>

            {/* Allowed Members */}
            {organizationId && (
              <div className="space-y-2">
                <Label>Allowed Members (Optional)</Label>
                <MemberSearchTypeahead
                  organizationId={organizationId}
                  multiSelect
                  value={allowedMembers as any}
                  onChange={onChangeAllowedMembers as any}
                  placeholder="Search and select members"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session Settings */}
      <Card className="my-8 shadow-none">
        <CardHeader>
          <CardTitle className="mb-2">Session Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Session Status</Label>
              <p className="text-xs text-muted-foreground">
                Whether the session is currently open for attendance marking
              </p>
            </div>
            <Switch checked={isOpen} onCheckedChange={onChangeIsOpen} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Self Marking</Label>
              <p className="text-xs text-muted-foreground">
                Members can self check-in via personal link or QR code
              </p>
            </div>
            <Switch
              checked={allowPublicMarking}
              onCheckedChange={(checked) => {
                onChangeAllowPublicMarking(checked);
                if (!checked) {
                  onChangeLocationId(null);
                  onChangeLocation(undefined);
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Location Settings */}
      {allowPublicMarking && (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Proximity & Location Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded border p-4">
              <div className="space-y-0.5">
                <Label>Inherit Location</Label>
                <p className="text-xs text-muted-foreground">
                  Use the organization or branch default location settings
                </p>
              </div>
              <Switch
                checked={!!locationId || (!location && !locationId)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onChangeLocation(undefined);
                    if (attendanceLocations.length > 0 && !locationId) {
                      onChangeLocationId(attendanceLocations[0].id);
                    }
                  } else {
                    onChangeLocationId(null);
                    if (!location) {
                      onChangeLocation({ lat: 0, lng: 0, radius: 100 });
                    }
                  }
                }}
              />
            </div>

            {(!locationId && location !== undefined) ? (
              <div className="mt-4">
                <LocationPicker
                  value={location || { lat: 0, lng: 0, radius: 100 }}
                  onChange={onChangeLocation}
                />
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <Label>Select Location to Inherit</Label>
                <Select
                  value={locationId || ''}
                  onValueChange={(val) => {
                    onChangeLocationId(val);
                    onChangeLocation(undefined);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a configured location" />
                  </SelectTrigger>
                  <SelectContent>
                    {attendanceLocations.length === 0 && (
                      <SelectItem value="none" disabled>
                        No locations configured
                      </SelectItem>
                    )}
                    {attendanceLocations.map((loc) => {
                      const isBranch = !!loc.branch_id;
                      const label = isBranch
                        ? `Branch Location`
                        : 'Organization Default';
                      return (
                        <SelectItem key={loc.id} value={loc.id}>
                          {label} ({loc.radius}m)
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      )}


      {/* Marking Modes */}
      <Card className="space-y-2 my-8 shadow-none">
        <CardHeader>
          <CardTitle>Marking Modes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select how attendance can be marked for this session
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(['manual', 'email', 'phone', 'membership_id'] as (keyof AttendanceMarkingModes)[]).map((mode) => (
              <label key={mode} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={markingModes[mode]}
                  onCheckedChange={(checked) => onChangeMarkingModes({ ...markingModes, [mode]: Boolean(checked) })}
                />
                <span className="capitalize">{String(mode).replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}