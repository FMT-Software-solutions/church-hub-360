import { useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportExportMenu } from '../ReportExportMenu';
import type { AttendanceReportData } from '@/hooks/attendance/useAttendanceReports';
import { formatDate } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface TableReportProps {
  report?: AttendanceReportData | null;
}

export function TableReport({ report }: TableReportProps) {
  const printableRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => {
    if (!report) return [];
    const sessionNameById = new Map(
      report.sessions.map((s) => [s.id, (s as any).name || 'Session'])
    );
    const memberInfoById = new Map(
      report.members.map((m) => [
        m.id,
        {
          name: (
            m.full_name ||
            `${m.first_name} ${m.last_name}` ||
            'Member'
          ).trim(),
          avatar: m.profile_image_url || null,
        },
      ])
    );
    return report.records.map((r) => ({
      Date: new Date(r.marked_at).toLocaleString(),
      Session: sessionNameById.get(r.session_id) || r.session_id,
      MemberId: r.member_id,
      MemberName: memberInfoById.get(r.member_id)?.name || r.member_id,
      AvatarUrl: memberInfoById.get(r.member_id)?.avatar || null,
    }));
  }, [report]);

  const summary = useMemo<Array<[string, unknown]>>(() => {
    if (!report) return [];
    return [
      ['Total Attendance', report.summary.total_attendance] as [
        string,
        unknown
      ],
      ['Unique Members', report.summary.unique_members] as [string, unknown],
      ['Sessions', report.summary.sessions_count] as [string, unknown],
      ['Avg/Day', report.summary.average_per_day] as [string, unknown],
    ];
  }, [report]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Attendance Records</CardTitle>
        <ReportExportMenu
          filenameBase="attendance-records"
          getRows={() => rows}
          getSummary={() => summary}
          printRef={printableRef}
          disabled={!report || rows.length === 0}
        />
      </CardHeader>
      <CardContent>
        <ScrollArea className={cn(rows.length > 10 ? 'h-[500px]' : '')}>
          <div ref={printableRef} className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="py-2 pr-4">Session</th>
                  <th className="py-2 pr-4">Recorded at</th>
                  <th className="py-2">Member</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-3 text-muted-foreground">
                      No records
                    </td>
                  </tr>
                )}
                {rows.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="py-2 pr-4">{row.Session as string}</td>

                    <td className="py-2 pr-4">
                      {formatDate(
                        new Date(row.Date as string),
                        'MMM dd, yyyy hh:mm a'
                      )}
                    </td>

                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <Avatar>
                          <AvatarImage
                            src={(row.AvatarUrl as string) || undefined}
                            alt={(row.MemberName as string) || 'Member'}
                          />
                          <AvatarFallback>
                            {String(row.MemberName || row.MemberId || 'M')
                              .split(' ')
                              .map((s) => s[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {(row.MemberName as string) ||
                            (row.MemberId as string)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
