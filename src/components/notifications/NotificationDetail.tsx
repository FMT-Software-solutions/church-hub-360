import {
  usePendingRequests,
  useRequestById,
} from '@/hooks/finance/useEditRequests';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRoleCheck } from '@/registry/access/RoleGuard';
import type { EditRequest } from '@/types/finance-requests';
import { useNotification } from '@/hooks/useNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function RequestItem({
  req,
  onResolve,
  isPendingResolving,
}: {
  req: EditRequest;
  onResolve: any;
  isPendingResolving: boolean;
}) {
  const isPending = req.status === 'pending';

  return (
    <div
      className={`border rounded-lg p-6 space-y-4 ${
        !isPending ? 'bg-muted/30' : ''
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <span className="font-semibold text-lg">
            {req.requester?.first_name}{' '}
            {req.requester?.last_name || req.requester?.email}
          </span>
          <div className="text-sm text-muted-foreground mt-1">
            requested to edit{' '}
            <span className="font-medium">{req.table_name}</span>
          </div>
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
        </span>
      </div>

      <div className="bg-muted/50 p-4 rounded-md text-sm border">
        {req.reason}
      </div>

      {!isPending && (
        <div className="text-sm font-medium px-3 py-1.5 rounded bg-secondary inline-block">
          Status: <span className="capitalize">{req.status}</span>
        </div>
      )}

      {isPending && (
        <div className="flex gap-3 justify-end pt-2">
          <Button
            variant="outline"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() =>
              onResolve.mutate({ requestId: req.id, status: 'rejected' })
            }
            disabled={isPendingResolving}
          >
            <X className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button
            onClick={() =>
              onResolve.mutate({ requestId: req.id, status: 'approved' })
            }
            disabled={isPendingResolving}
          >
            <Check className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </div>
      )}
    </div>
  );
}

export function NotificationDetail({
  notificationId,
  onBack,
}: {
  notificationId: string;
  onBack: () => void;
}) {
  const {
    data: notification,
    isLoading: isNotificationLoading,
  } = useNotification(notificationId);
  const { isOwner } = useRoleCheck();

  // Logic for edit requests
  const isEditRequest =
    notification?.type.startsWith('edit_request') &&
    !!notification?.resource_id;
  const { data: request, isLoading: isRequestLoading } = useRequestById(
    isEditRequest ? notification.resource_id : null
  );
  const { resolveRequest } = usePendingRequests();

  const metadata = notification?.metadata
    ? JSON.parse(notification.metadata)
    : null;

  if (isNotificationLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground mb-4">Notification not found</p>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Notifications
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl">{notification.title}</CardTitle>
              <div className="text-sm text-muted-foreground">
                Received{' '}
                {formatDistanceToNow(new Date(notification.created_at), {
                  addSuffix: true,
                })}
              </div>
            </div>
            {!notification.is_read && <Badge>New</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-base leading-relaxed">
            {notification.message}
          </div>

          {metadata && (
            <div className="bg-muted/30 p-4 rounded-md text-sm border mt-4 space-y-2">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Details
              </h4>
              {Object.entries(metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted-foreground">{key}:</span>
                  <span className="font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
          )}

          {isEditRequest && isOwner() && (
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Request Details
              </h3>

              {isRequestLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : request ? (
                <RequestItem
                  req={request}
                  onResolve={resolveRequest}
                  isPendingResolving={resolveRequest.isPending}
                />
              ) : (
                <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
                  Request details not found or access denied.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
