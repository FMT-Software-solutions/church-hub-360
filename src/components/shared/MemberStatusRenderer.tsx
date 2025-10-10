import type { MembershipStatus } from '@/types';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

export const MemberStatusRenderer = ({
  status,
}: {
  status: MembershipStatus;
}) => {
  // Get status icon and color
  const getStatusDisplay = (status: MembershipStatus) => {
    switch (status) {
      case 'active':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-100',
          text: 'Active',
        };
      case 'inactive':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bg: 'bg-red-100',
          text: 'Inactive',
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
          text: 'Pending',
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          text: 'Unknown',
        };
    }
  };

  const statusDisplay = getStatusDisplay(status);
  const StatusIcon = statusDisplay.icon;

  return (
    <Badge
      variant="secondary"
      className={cn(
        statusDisplay.bg,
        statusDisplay.color,
        'flex items-center gap-1'
      )}
    >
      <StatusIcon className="h-3 w-3" />
      {statusDisplay.text}
    </Badge>
  );
};
