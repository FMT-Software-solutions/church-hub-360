import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ReportFilterMode } from '@/hooks/reports/useReportFilters';

interface TopFiltersBarProps {
  mode: ReportFilterMode;
  onChange: (mode: ReportFilterMode) => void;
}

export function TopFiltersBar({ mode, onChange }: TopFiltersBarProps) {
  return (
    <Tabs value={mode} onValueChange={(v) => onChange(v as ReportFilterMode)} className="w-full">
      <TabsList className="grid grid-cols-3 w-full">
        <TabsTrigger value="occasions_sessions">Occasions & Sessions</TabsTrigger>
        <TabsTrigger value="tags_groups">Tags & Groups</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}