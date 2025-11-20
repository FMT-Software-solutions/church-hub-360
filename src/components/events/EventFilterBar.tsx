import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { DatePresetPicker, type DatePresetValue } from '@/components/attendance/reports/DatePresetPicker';
import type { EventActivityFilters, EventActivityType, EventActivityStatus } from '@/types/events';
import { SingleBranchSelector } from '@/components/shared/BranchSelector';

interface EventFilterBarProps {
  filters: EventActivityFilters & { date_filter?: DatePresetValue };
  onFiltersChange: (f: EventFilterBarProps['filters']) => void;
  onAddClick?: () => void;
  showAddButton?: boolean;
}

export const EventFilterBar: React.FC<EventFilterBarProps> = ({ filters, onFiltersChange, onAddClick, showAddButton = true }) => {
  const setFilter = (patch: Partial<EventFilterBarProps['filters']>) => onFiltersChange({ ...filters, ...patch });

  const preset = filters.date_filter || { preset: 'last_30_days', range: { from: new Date(), to: new Date() } };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label>Search</Label>
          <Input value={filters.search || ''} onChange={(e) => setFilter({ search: e.target.value || undefined })} placeholder="Search title or description" />
        </div>
        <div>
          <Label>Type</Label>
          <Select value={filters.type as EventActivityType | undefined} onValueChange={(v) => setFilter({ type: (v as EventActivityType) || undefined })}>
            <SelectTrigger className="w-full"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="activity">Activity</SelectItem>
              <SelectItem value="announcement">Announcement</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Branch</Label>
          <SingleBranchSelector
            value={filters.branch_id || undefined}
            onValueChange={(v) => setFilter({ branch_id: v || undefined })}
            placeholder="All branches"
            allowClear
          />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={filters.status as EventActivityStatus | undefined} onValueChange={(v) => setFilter({ status: (v as EventActivityStatus) || undefined })}>
            <SelectTrigger className="w-full"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {showAddButton && (
        <div className="flex items-end">
          <Button onClick={onAddClick}>Add Event/Activity</Button>
        </div>
      )}

      <DatePresetPicker
        value={preset}
        onChange={(v) => {
          const fromIso = v.range.from.toISOString();
          const toIso = v.range.to.toISOString();
          setFilter({ date_filter: v, date_from: fromIso, date_to: toIso });
        }}
      />
    </div>
  );
};

