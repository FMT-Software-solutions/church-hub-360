import { Badge } from '@/components/ui/badge';
import type { AttendanceSessionWithRelations } from '@/types/attendance';

export function SessionStatusBadge({ session }: { session: AttendanceSessionWithRelations }) {
  if (session.is_current && session.is_open) {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        Session Active
      </Badge>
    );
  }
  if (session.is_current && !session.is_open) {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        Session Closed
      </Badge>
    );
  }
  if (session.is_future) {
    return (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
        Upcoming
      </Badge>
    );
  }
  return <Badge variant="destructive">Session Ended</Badge>;
}
