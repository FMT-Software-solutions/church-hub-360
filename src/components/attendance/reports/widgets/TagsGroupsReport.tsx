import { useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportExportMenu } from '../ReportExportMenu';
import type { AttendanceReportData } from '@/hooks/attendance/useAttendanceReports';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useTagsQuery } from '@/hooks/useRelationalTags';
import { useAllGroups } from '@/hooks/useGroups';

interface TagsGroupsReportProps {
  report?: AttendanceReportData | null;
  showTags?: boolean;
  showGroups?: boolean;
  selectedTagItemIds?: string[];
  selectedGroupIds?: string[];
}

export function TagsGroupsReport({ report, showTags = true, showGroups = true, selectedTagItemIds = [], selectedGroupIds = [] }: TagsGroupsReportProps) {
  const printableRef = useRef<HTMLDivElement>(null);
  const { currentOrganization } = useOrganization();
  const { data: relationalTags = [] } = useTagsQuery(currentOrganization?.id);
  const { data: allGroups = [] } = useAllGroups();

  const { tagCounts, groupCounts, exportRows } = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    const groupCounts: Record<string, number> = {};

    // Build selected names sets for intersection
    const selectedTagNames = new Set<string>();
    for (const t of relationalTags) {
      for (const item of t.tag_items || []) {
        if (selectedTagItemIds.includes(item.id)) {
          selectedTagNames.add(String(item.name));
        }
      }
    }
    const selectedGroupNames = new Set<string>();
    for (const g of allGroups) {
      if (selectedGroupIds.includes(g.id)) {
        selectedGroupNames.add(String(g.name));
      }
    }

    if (report && Array.isArray(report.members)) {
      for (const m of report.members) {
        const tags = Array.isArray(m.tags_array) ? m.tags_array : [];
        // Count only selected tags
        tags
          .filter((t) => selectedTagNames.has(String(t)))
          .forEach((t) => {
            const key = String(t);
            tagCounts[key] = (tagCounts[key] || 0) + 1;
          });

        const groups = Array.isArray(m.member_groups) ? m.member_groups : [];
        // Count only selected groups
        groups
          .map((g) => String(g).split(' - ')[0] || String(g))
          .filter((name) => selectedGroupNames.has(name))
          .forEach((name) => {
            groupCounts[name] = (groupCounts[name] || 0) + 1;
          });
      }
    }

    const exportRows: Array<{ Type: string; Label: string; Count: number }> = [];
    if (showTags) {
      for (const [label, count] of Object.entries(tagCounts)) {
        exportRows.push({ Type: 'Tag', Label: label, Count: count });
      }
    }
    if (showGroups) {
      for (const [label, count] of Object.entries(groupCounts)) {
        exportRows.push({ Type: 'Group', Label: label, Count: count });
      }
    }
    return { tagCounts, groupCounts, exportRows };
  }, [report, showTags, showGroups]);
  // Note: we intentionally do not include relationalTags/allGroups in deps to avoid flicker; selected IDs changes trigger re-render in parent

  const sortedTagEntries = useMemo(() => {
    return Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  }, [tagCounts]);

  const sortedGroupEntries = useMemo(() => {
    return Object.entries(groupCounts).sort((a, b) => b[1] - a[1]);
  }, [groupCounts]);

  const isEmpty = (!showTags || sortedTagEntries.length === 0) && (!showGroups || sortedGroupEntries.length === 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tags & Groups Breakdown</CardTitle>
        <ReportExportMenu filenameBase="tags-groups-breakdown" getRows={() => exportRows} printRef={printableRef} disabled={!report || isEmpty} />
      </CardHeader>
      <CardContent>
        <div ref={printableRef} className="space-y-6">
          {isEmpty && (
            <div className="text-muted-foreground text-sm">No data</div>
          )}
          {showTags && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2 pr-4">Tag</th>
                    <th className="py-2">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTagEntries.length === 0 && (
                    <tr>
                      <td colSpan={2} className="py-3 text-muted-foreground">No tags</td>
                    </tr>
                  )}
                  {sortedTagEntries.map(([label, count]) => (
                    <tr key={label} className="border-t">
                      <td className="py-2 pr-4">{label}</td>
                      <td className="py-2">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {showGroups && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2 pr-4">Group</th>
                    <th className="py-2">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedGroupEntries.length === 0 && (
                    <tr>
                      <td colSpan={2} className="py-3 text-muted-foreground">No groups</td>
                    </tr>
                  )}
                  {sortedGroupEntries.map(([label, count]) => (
                    <tr key={label} className="border-t">
                      <td className="py-2 pr-4">{label}</td>
                      <td className="py-2">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}