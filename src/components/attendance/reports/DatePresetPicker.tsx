import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  formatDate,
  startOfYear,
  endOfYear,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { DatePicker } from '@/components/shared/DatePicker';

export type DatePreset =
  | 'custom'
  | 'yesterday'
  | 'last_3_days'
  | 'last_7_days'
  | 'last_15_days'
  | 'last_30_days'
  | 'last_60_days'
  | 'last_90_days'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'last_2_months'
  | 'last_3_months'
  | 'this_year';
export interface DatePresetValue {
  preset: DatePreset;
  range: { from: Date; to: Date };
}

function computeRange(preset: DatePreset): { from: Date; to: Date } {
  const now = new Date();
  switch (preset) {
    case 'yesterday': {
      const y = addDays(now, -1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case 'last_3_days':
      return { from: startOfDay(addDays(now, -2)), to: endOfDay(now) };
    case 'last_7_days':
      return { from: startOfDay(addDays(now, -6)), to: endOfDay(now) };
    case 'last_15_days':
      return { from: startOfDay(addDays(now, -14)), to: endOfDay(now) };
    case 'last_30_days':
      return { from: startOfDay(addDays(now, -29)), to: endOfDay(now) };
    case 'last_60_days':
      return { from: startOfDay(addDays(now, -59)), to: endOfDay(now) };
    case 'last_90_days':
      return { from: startOfDay(addDays(now, -89)), to: endOfDay(now) };
    case 'this_week': {
      return {
        from: startOfDay(startOfWeek(now)),
        to: endOfDay(endOfWeek(now)),
      };
    }
    case 'this_month': {
      return { from: startOfMonth(now), to: endOfMonth(now) };
    }
    case 'last_month': {
      const last = subMonths(now, 1);
      return { from: startOfMonth(last), to: endOfMonth(last) };
    }
    case 'last_2_months': {
      const twoAgo = subMonths(now, 2);
      const oneAgo = subMonths(now, 1);
      return { from: startOfMonth(twoAgo), to: endOfMonth(oneAgo) };
    }
    case 'last_3_months': {
      const threeAgo = subMonths(now, 3);
      const oneAgo = subMonths(now, 1);
      return { from: startOfMonth(threeAgo), to: endOfMonth(oneAgo) };
    }
    case 'this_year': {
      return { from: startOfYear(now), to: endOfYear(now) };
    }
    case 'custom':
    default:
      return { from: startOfDay(now), to: endOfDay(now) };
  }
}

interface DatePresetPickerProps {
  value: DatePresetValue;
  onChange: (v: DatePresetValue) => void;
}

export function DatePresetPicker({ value, onChange }: DatePresetPickerProps) {
  const current = value?.preset || 'last_30_days';
  const range = useMemo(() => {
    return current === 'custom' && value?.range
      ? value.range
      : computeRange(current);
  }, [current, value?.range]);

  return (
    <div className="space-y-2">
      <Label>Date Range Preset</Label>
      <Select
        value={current}
        onValueChange={(p: DatePreset) =>
          onChange({
            preset: p,
            range:
              p === 'custom' && value?.range ? value.range : computeRange(p),
          })
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select preset" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="yesterday">Yesterday</SelectItem>
          <SelectItem value="last_3_days">The Last 3 days</SelectItem>
          <SelectItem value="last_7_days">The Last 7 days</SelectItem>
          <SelectItem value="last_15_days">The Last 15 days</SelectItem>
          <SelectItem value="last_30_days">The Last 30 days</SelectItem>
          <SelectItem value="last_60_days">The Last 60 days</SelectItem>
          <SelectItem value="last_90_days">The Last 90 days</SelectItem>
          <SelectItem value="this_week">This week</SelectItem>
          <SelectItem value="this_month">This month</SelectItem>
          <SelectItem value="last_month">Last month</SelectItem>
          <SelectItem value="last_2_months">Last 2 months</SelectItem>
          <SelectItem value="last_3_months">Last 3 months</SelectItem>
          <SelectItem value="this_year">This year</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>
      {current === 'custom' && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DatePicker
            label="From"
            value={range.from.toISOString().split('T')[0]}
            onChange={(dateStr) => {
              const nextFrom = dateStr
                ? new Date(`${dateStr}T00:00:00Z`)
                : range.from;
              onChange({
                preset: 'custom',
                range: { from: nextFrom, to: range.to },
              });
            }}
            formatDateLabel={(d) => formatDate(d, 'MMM dd, yyyy')}
            align="start"
          />
          <DatePicker
            label="To"
            value={range.to.toISOString().split('T')[0]}
            onChange={(dateStr) => {
              const nextTo = dateStr
                ? new Date(`${dateStr}T23:59:59Z`)
                : range.to;
              onChange({
                preset: 'custom',
                range: { from: range.from, to: nextTo },
              });
            }}
            formatDateLabel={(d) => formatDate(d, 'MMM dd, yyyy')}
            align="start"
          />
        </div>
      )}
      <div className="text-muted-foreground text-sm">
        {formatDate(range.from, 'MMM dd, yyyy')} —{' '}
        {formatDate(range.to, 'MMM dd, yyyy')}
      </div>
    </div>
  );
}
