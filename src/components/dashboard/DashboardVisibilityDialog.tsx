import { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Settings2 } from 'lucide-react';
import { useDashboardPreferences } from '@/hooks/dashboard/useDashboardPreferences';
import { DEFAULT_SECTIONS } from '@/db/dashboardPrefsDb';

const SECTION_LABELS: Record<string, string> = {
  birthdays: 'Upcoming Birthdays',
  events: 'Upcoming Events',
  membership: 'Membership',
  tags_groups: 'Tags & Groups',
  attendance: 'Attendance',
  finances: 'Finances',
  assets: 'Assets',
  branches: 'Branches',
  recent_groups: 'Recent Groups',
  announcements: 'Announcements',
  finance_breakdown_chart: 'Finance Breakdown Chart',
  attendance_trend_chart: 'Attendance Trend Chart',
  members_gender_chart: 'Members by Gender Chart',
};

export function DashboardVisibilityDialog() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  const {
    prefs,
    isLoading,
    setSectionVisibility,
    setComponentVisibility,
  } = useDashboardPreferences(orgId);
  const [open, setOpen] = useState(false);
  const mergedSections = prefs
    ? { ...DEFAULT_SECTIONS, ...prefs.sections }
    : DEFAULT_SECTIONS;
  const groups: Array<{
    label: string;
    parent: keyof typeof mergedSections;
    children?: Array<keyof typeof mergedSections>;
  }> = [
    {
      label: 'Membership',
      parent: 'membership',
      children: ['members_gender_chart'],
    },
    {
      label: 'Attendance',
      parent: 'attendance',
      children: ['attendance_trend_chart'],
    },
    {
      label: 'Finance',
      parent: 'finances',
      children: ['finance_breakdown_chart'],
    },
    {
      label: 'Tags & Groups',
      parent: 'tags_groups',
      children: ['recent_groups'],
    },
    { label: 'Announcements', parent: 'announcements' },
    { label: 'Birthdays', parent: 'birthdays' },
    { label: 'Events', parent: 'events' },
    { label: 'Assets', parent: 'assets' },
    { label: 'Branches', parent: 'branches' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          aria-label="Configure dashboard"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dashboard Visibility</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {isLoading && (
            <div className="text-sm text-muted-foreground">Loading…</div>
          )}
          {!isLoading &&
            groups.map((g) => (
              <div key={g.parent} className="space-y-2">
                <label className="flex items-center space-x-2">
                  <Checkbox
                    checked={!!mergedSections[g.parent]}
                    onCheckedChange={(v) =>
                      setSectionVisibility(g.parent as any, !!v)
                    }
                  />
                  <Label className="text-sm font-medium">
                    {SECTION_LABELS[g.parent]}
                  </Label>
                </label>
                {g.children && (
                  <div className="pl-6 space-y-1">
                    {g.children.map((ck) => (
                      <label key={ck} className="flex items-center space-x-2">
                        <Checkbox
                          checked={!!mergedSections[ck]}
                          disabled={!mergedSections[g.parent]}
                          onCheckedChange={(v) =>
                            setSectionVisibility(ck as any, !!v)
                          }
                        />
                        <Label className="text-sm">{SECTION_LABELS[ck]}</Label>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
        {!isLoading && prefs && (
          <div className="mt-4 space-y-2">
            <div className="text-xs text-muted-foreground">
              Other Components
            </div>
            <label className="flex items-center space-x-2">
              <Checkbox
                checked={prefs.componentsVisibility?.quick_actions !== false}
                onCheckedChange={(v) => {
                  const visible = !!v;
                  setComponentVisibility('quick_actions', visible);
                }}
              />
              <Label className="text-sm">Quick Actions</Label>
            </label>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
