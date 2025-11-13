import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/shared/DateTimePicker';
import { SingleBranchSelector } from '@/components/shared/BranchSelector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateEvent, useUpdateEvent } from '@/hooks/events/useEvents';
import type {
  CreateEventActivityInput,
  EventActivityType,
  EventActivityWithRelations,
  ReminderMethod,
} from '@/types/events';

interface EventFormDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: 'add' | 'edit';
  initialData?:
    | Partial<EventActivityWithRelations & { id?: string }>
    | Partial<CreateEventActivityInput>;
  title?: string;
  onSuccess?: (record?: EventActivityWithRelations) => void;
}

export const EventFormDialog: React.FC<EventFormDialogProps> = ({
  open,
  onOpenChange,
  mode = 'add',
  initialData,
  title,
  onSuccess,
}) => {
  const isAdd = mode === 'add';
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof open === 'boolean';
  const computedOpen = isControlled ? !!open : internalOpen;
  const setOpen = (val: boolean) => {
    if (isControlled) onOpenChange?.(val);
    else setInternalOpen(val);
  };

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  const [form, setForm] = useState<CreateEventActivityInput>(() => ({
    title: (initialData as any)?.title ?? '',
    description: (initialData as any)?.description ?? '',
    type: (initialData as any)?.type ?? 'event',
    category: (initialData as any)?.category ?? '',
    start_time:
      (initialData as any)?.start_time ?? new Date().toISOString().slice(0, 16),
    end_time: (initialData as any)?.end_time ?? '',
    all_day: (initialData as any)?.all_day ?? false,
    location: (initialData as any)?.location ?? '',
    branch_id: (initialData as any)?.branch_id ?? null,
    remind_at: (initialData as any)?.remind_at ?? '',
    remind_method: (initialData as any)?.remind_method ?? 'none',
    is_active: (initialData as any)?.is_active ?? true,
    organization_id: (initialData as any)?.organization_id ?? '',
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.title || form.title.trim().length < 3)
      next.title = 'Title is required (min 3 chars)';
    if (!form.start_time) next.start_time = 'Start date/time is required';
    if (form.end_time) {
      const s = new Date(form.start_time);
      const e = new Date(form.end_time);
      if (e < s) next.end_time = 'End cannot be before start';
    }
    if (form.remind_method && form.remind_method !== 'none' && !form.remind_at)
      next.remind_at = 'Reminder time required for selected method';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  useEffect(() => {
    if (!computedOpen) return;
    const data = initialData as any;
    if (data) {
      setForm((prev) => ({
        ...prev,
        title: data?.title ?? '',
        description: data?.description ?? '',
        type: data?.type ?? 'event',
        category: data?.category ?? '',
        start_time: data?.start_time ?? new Date().toISOString().slice(0, 16),
        end_time: data?.end_time ?? '',
        all_day: data?.all_day ?? false,
        location: data?.location ?? '',
        branch_id: data?.branch_id ?? null,
        remind_at: data?.remind_at ?? '',
        remind_method: data?.remind_method ?? 'none',
        is_active: data?.is_active ?? true,
        organization_id: data?.organization_id ?? '',
      }));
    } else if (isAdd) {
      setForm((prev) => ({
        ...prev,
        title: '',
        description: '',
        type: 'event',
        category: '',
        start_time: new Date().toISOString().slice(0, 16),
        end_time: '',
        all_day: false,
        location: '',
        branch_id: null,
        remind_at: '',
        remind_method: 'none',
        is_active: true,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedOpen, mode, initialData]);

  const editingId: string | undefined = (initialData as any)?.id;

  const onSubmit = async () => {
    try {
      if (!validate()) return;
      if (isAdd) {
        const created = await createEvent.mutateAsync(form);
        onSuccess?.(created as any);
        setOpen(false);
      } else if (editingId) {
        const updates = { ...form } as any;
        const updated = await updateEvent.mutateAsync({
          id: editingId,
          updates,
        });
        onSuccess?.(updated as any);
        setOpen(false);
      }
    } catch (err) {}
  };

  const typeOptions: { value: EventActivityType; label: string }[] = [
    { value: 'event', label: 'Event' },
    { value: 'activity', label: 'Activity' },
    { value: 'announcement', label: 'Announcement' },
  ];

  const reminderOptions: { value: ReminderMethod; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'email', label: 'Email' },
    { value: 'push', label: 'Push' },
    { value: 'sms', label: 'SMS' },
  ];

  return (
    <Dialog open={computedOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {title || (isAdd ? 'Add Event/Activity' : 'Edit Event/Activity')}
          </DialogTitle>
          <DialogDescription>
            Manage scheduling and announcement details.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Event title"
              />
              {errors.title && (
                <div className="text-destructive text-xs mt-1">
                  {errors.title}
                </div>
              )}
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={form.type as EventActivityType}
                onValueChange={(v) =>
                  setForm({ ...form, type: v as EventActivityType })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Input
                value={form.category || ''}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Category"
              />
            </div>
            <div>
              <Label>Branch</Label>
              <SingleBranchSelector
                value={form.branch_id || undefined}
                onValueChange={(value) =>
                  setForm({ ...form, branch_id: value || null })
                }
                placeholder="Select a branch"
                allowClear
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <DateTimePicker
                id="start"
                dateLabel="Start Date"
                timeLabel="Start Time"
                value={form.start_time}
                onChange={(v) => setForm({ ...form, start_time: v })}
              />
              {errors.start_time && (
                <div className="text-destructive text-xs mt-1">
                  {errors.start_time}
                </div>
              )}
            </div>
            <div>
              <DateTimePicker
                id="end"
                dateLabel="End Date"
                timeLabel="End Time"
                value={form.end_time || ''}
                onChange={(v) => setForm({ ...form, end_time: v })}
              />
              {errors.end_time && (
                <div className="text-destructive text-xs mt-1">
                  {errors.end_time}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <Label>All Day</Label>
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={!!form.all_day}
                  onCheckedChange={(v) => setForm({ ...form, all_day: v })}
                />
                <span className="text-sm text-muted-foreground">
                  Run for the whole day
                </span>
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={form.location || ''}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Location"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Reminder</Label>
              <Select
                value={(form.remind_method || 'none') as ReminderMethod}
                onValueChange={(v) =>
                  setForm({ ...form, remind_method: v as ReminderMethod })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Reminder method" />
                </SelectTrigger>
                <SelectContent>
                  {reminderOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Remind At</Label>
              <DateTimePicker
                id="remind"
                dateLabel="Date"
                timeLabel="Time"
                value={form.remind_at || ''}
                onChange={(v) => setForm({ ...form, remind_at: v })}
              />
              {errors.remind_at && (
                <div className="text-destructive text-xs mt-1">
                  {errors.remind_at}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description || ''}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Description"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-2 justify-end w-full">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createEvent.isPending || updateEvent.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={createEvent.isPending || updateEvent.isPending}
            >
              {isAdd
                ? createEvent.isPending
                  ? 'Saving…'
                  : 'Save'
                : updateEvent.isPending
                ? 'Updating…'
                : 'Update'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
