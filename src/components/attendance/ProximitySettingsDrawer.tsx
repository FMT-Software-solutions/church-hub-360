import { useEffect, useMemo, useState } from 'react';
import { Building2, MapPinned, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { LocationPicker } from '@/components/shared/LocationPicker';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  useAttendanceLocations,
  useSaveAttendanceLocation,
} from '@/hooks/attendance/useAttendanceLocations';
import { useBranches, useUserBranches } from '@/hooks/useBranchQueries';
import { useRoleCheck } from '@/registry/access/RoleGuard';
import type { AttendanceLocation, AttendanceLocationRecord, Branch } from '@/types';

interface ProximitySettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ORGANIZATION_SCOPE = '__organization__';

function toLocationValue(
  location?: AttendanceLocationRecord | AttendanceLocation | null
): AttendanceLocation | null {
  if (!location) {
    return null;
  }

  return {
    lat: location.lat,
    lng: location.lng,
    radius: location.radius,
    country: location.country ?? null,
    city: location.city ?? null,
    state_region: location.state_region ?? null,
    street: location.street ?? null,
    full_address: location.full_address ?? null,
  };
}

export function ProximitySettingsDrawer({
  open,
  onOpenChange,
}: ProximitySettingsDrawerProps) {
  const { currentOrganization } = useOrganization();
  const { data: branches = [], isLoading: branchesLoading } = useBranches(
    currentOrganization?.id
  );
  const { data: locations = [], isLoading: locationsLoading } =
    useAttendanceLocations();
  const { canManageAllData } = useRoleCheck();
  const { user } = useAuth();
  const { data: userBranches = [] } = useUserBranches(
    user?.id,
    currentOrganization?.id
  );
  const saveLocation = useSaveAttendanceLocation();
  const [scopeValue, setScopeValue] = useState(ORGANIZATION_SCOPE);
  const [draftLocation, setDraftLocation] = useState<AttendanceLocation | null>(null);

  const assignedBranchIds = useMemo(
    () => userBranches.map((assignment) => assignment.branch_id).filter(Boolean),
    [userBranches]
  );

  const visibleBranches = useMemo(() => {
    if (canManageAllData()) {
      return branches;
    }

    return branches.filter((branch) => assignedBranchIds.includes(branch.id));
  }, [assignedBranchIds, branches, canManageAllData]);

  const selectedBranchId =
    scopeValue === ORGANIZATION_SCOPE ? null : scopeValue;

  const defaultLocation = useMemo(
    () => locations.find((location) => !location.branch_id) ?? null,
    [locations]
  );

  const selectedLocationRecord = useMemo(
    () =>
      locations.find((location) =>
        selectedBranchId ? location.branch_id === selectedBranchId : !location.branch_id
      ) ?? null,
    [locations, selectedBranchId]
  );

  const selectedBranch = useMemo<Branch | null>(
    () =>
      selectedBranchId
        ? visibleBranches.find((branch) => branch.id === selectedBranchId) ?? null
        : null,
    [selectedBranchId, visibleBranches]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextValue =
      toLocationValue(selectedLocationRecord) ??
      (selectedBranchId ? toLocationValue(defaultLocation) : null);

    setDraftLocation(nextValue);
  }, [defaultLocation, open, selectedBranchId, selectedLocationRecord]);

  useEffect(() => {
    if (!open) {
      setScopeValue(ORGANIZATION_SCOPE);
    }
  }, [open]);

  const handleSave = async () => {
    if (!draftLocation) {
      return;
    }

    await saveLocation.mutateAsync({
      id: selectedLocationRecord?.id,
      branch_id: selectedBranchId,
      lat: draftLocation.lat,
      lng: draftLocation.lng,
      radius: draftLocation.radius ?? 100,
      country: draftLocation.country ?? null,
      city: draftLocation.city ?? null,
      state_region: draftLocation.state_region ?? null,
      street: draftLocation.street ?? null,
      full_address: draftLocation.full_address ?? null,
    });

    onOpenChange(false);
  };

  const isBusy =
    branchesLoading || locationsLoading || saveLocation.isPending;
  const branchOptions = visibleBranches;
  const currentTargetLabel = selectedBranch
    ? selectedBranch.name
    : 'Organization Default';
  const inheritsFromDefault =
    !!selectedBranchId && !selectedLocationRecord && !!defaultLocation;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (scopeValue === ORGANIZATION_SCOPE) {
      return;
    }

    if (branchOptions.some((branch) => branch.id === scopeValue)) {
      return;
    }

    setScopeValue(ORGANIZATION_SCOPE);
  }, [branchOptions, open, scopeValue]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl">
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <MapPinned className="h-5 w-5" />
            Attendance Proximity Settings
          </SheetTitle>
          <SheetDescription>
            Configure the general attendance location that sessions can inherit or
            override later.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="attendance-location-scope">Location target</Label>
                <Select value={scopeValue} onValueChange={setScopeValue}>
                  <SelectTrigger id="attendance-location-scope">
                    <SelectValue placeholder="Select branch or organization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ORGANIZATION_SCOPE}>
                      Organization Default
                    </SelectItem>
                    {branchOptions.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant={selectedLocationRecord ? 'default' : 'secondary'}>
                  {selectedLocationRecord ? 'Configured' : 'Not Configured'}
                </Badge>
                {inheritsFromDefault ? (
                  <Badge variant="outline">Using organization default as base</Badge>
                ) : null}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-md border bg-background px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Saving for
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span>{currentTargetLabel}</span>
                </div>
              </div>
              <div className="rounded-md border bg-background px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Behavior
                </p>
                <p className="mt-1 text-xs text-foreground">
                  Sessions can inherit this location.
                </p>
              </div>
            </div>
          </div>

          <LocationPicker
            value={draftLocation}
            onChange={setDraftLocation}
            disabled={isBusy}
            defaultRadius={defaultLocation?.radius ?? 100}
          />
        </div>

        <SheetFooter className="border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saveLocation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={!draftLocation || isBusy}
          >
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
