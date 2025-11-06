import { useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportExportMenu } from '../ReportExportMenu';
import type { AttendanceReportData } from '@/hooks/attendance/useAttendanceReports';

interface GenderReportProps {
  report?: AttendanceReportData | null;
  disabled?: boolean;
}

export function GenderReport({ report, disabled }: GenderReportProps) {
  const printableRef = useRef<HTMLDivElement>(null);
  const rows = useMemo(() => {
    if (!report) return [] as Array<{ Gender: string; Count: number }>;
    const entries = Object.entries(report.demographic.byGender);
    return entries.map(([k, v]) => ({ Gender: k, Count: v }));
  }, [report]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gender Breakdown</CardTitle>
        <ReportExportMenu filenameBase="gender-breakdown" getRows={() => rows} printRef={printableRef} disabled={disabled || !report || rows.length === 0} />
      </CardHeader>
      <CardContent>
        <div ref={printableRef}>
          {disabled ? (
            <div className="text-muted-foreground text-sm">Select 2 or more members to view gender distribution.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2 pr-4">Gender</th>
                    <th className="py-2">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={2} className="py-3 text-muted-foreground">No data</td>
                    </tr>
                  )}
                  {rows.map((row, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="py-2 pr-4">{row.Gender}</td>
                      <td className="py-2">{row.Count}</td>
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