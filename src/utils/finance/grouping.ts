import { parseISO } from 'date-fns';
import { format as formatDate, getWeek, getQuarter, getYear, getMonth } from 'date-fns';
import type { DateFilter } from '@/types/finance';
import { resolveDateFilterRange, formatResolvedRangeLabel } from '@/utils/finance/dateRange';

export type GroupUnit = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface BucketKey {
  key: string; // stable key for column ordering, e.g., '2025-01', '2025-W03'
  label: string; // human-friendly label, e.g., 'Jan 2025', 'Week 03 2025'
}

export interface PivotSpec {
  unit: GroupUnit;
  buckets: BucketKey[];
  rangeLabel?: string;
}

/**
 * Build pivot spec based on a DateFilter and grouping unit.
 * Produces ordered buckets (columns) and a human-friendly range label.
 */
export function buildPivotSpec(dateFilter: DateFilter, unit: GroupUnit): PivotSpec {
  const resolved = resolveDateFilterRange(dateFilter);
  const rangeLabel = formatResolvedRangeLabel(resolved);
  if (!resolved) {
    return { unit, buckets: [], rangeLabel };
  }
  const { start, end } = resolved;

  const buckets: BucketKey[] = [];
  // Iterate days from start to end inclusive and add buckets according to unit
  let cursor = new Date(start);
  const endDate = new Date(end);

  const seen = new Set<string>();
  while (cursor <= endDate) {
    const y = getYear(cursor);
    let key = '';
    let label = '';
    switch (unit) {
      case 'day': {
        key = formatDate(cursor, 'yyyy-MM-dd');
        label = formatDate(cursor, 'MMM dd, yyyy');
        // advance by 1 day
        cursor.setDate(cursor.getDate() + 1);
        break;
      }
      case 'week': {
        const w = getWeek(cursor, { weekStartsOn: 1 });
        key = `${y}-W${String(w).padStart(2, '0')}`;
        label = `Week ${String(w).padStart(2, '0')} ${y}`;
        // advance by 1 week
        cursor.setDate(cursor.getDate() + 7);
        break;
      }
      case 'month': {
        const m = getMonth(cursor) + 1; // 1-12
        key = `${y}-${String(m).padStart(2, '0')}`;
        label = formatDate(cursor, 'MMM yyyy');
        // advance by 1 month
        cursor.setMonth(cursor.getMonth() + 1);
        break;
      }
      case 'quarter': {
        const q = getQuarter(cursor); // 1-4
        key = `${y}-Q${q}`;
        label = `Q${q} ${y}`;
        // advance by ~1 quarter (3 months)
        cursor.setMonth(cursor.getMonth() + 3);
        break;
      }
      case 'year': {
        key = `${y}`;
        label = `${y}`;
        // advance by 1 year
        cursor.setFullYear(cursor.getFullYear() + 1);
        break;
      }
    }
    if (!seen.has(key)) {
      buckets.push({ key, label });
      seen.add(key);
    }
  }
  return { unit, buckets, rangeLabel };
}

/**
 * Returns the bucket key for a given ISO date according to the unit.
 */
export function dateToBucketKey(dateISO: string, unit: GroupUnit): string {
  const d = parseISO(dateISO);
  const y = getYear(d);
  switch (unit) {
    case 'day':
      return formatDate(d, 'yyyy-MM-dd');
    case 'week': {
      const w = getWeek(d, { weekStartsOn: 1 });
      return `${y}-W${String(w).padStart(2, '0')}`;
    }
    case 'month': {
      const m = getMonth(d) + 1;
      return `${y}-${String(m).padStart(2, '0')}`;
    }
    case 'quarter': {
      const q = getQuarter(d);
      return `${y}-Q${q}`;
    }
    case 'year':
    default:
      return `${y}`;
  }
}