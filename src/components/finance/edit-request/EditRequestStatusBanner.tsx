import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { EditRequest } from '@/types/finance-requests';
import { Clock, Lock, RefreshCw, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface EditRequestStatusBannerProps {
  request: EditRequest;
  onRefresh: () => void;
  onCancel: () => void;
  isRefreshing: boolean;
  isOwner?: boolean;
}

export function EditRequestStatusBanner({
  request,
  onRefresh,
  onCancel,
  isRefreshing,
  isOwner,
}: EditRequestStatusBannerProps) {
  const { user } = useAuth();
  const isRequester = request.requester_id === user?.id;

  if (!isRequester) {
    const requesterName = request.requester
      ? `${request.requester.first_name || ''} ${
          request.requester.last_name || ''
        }`.trim() || request.requester.email
      : 'Another user';

    return (
      <Alert variant="destructive" className="mb-4">
        <Lock className="h-4 w-4" />
        <AlertTitle>Locked by {requesterName}</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <span>
            This record is currently being edited or requested by another user.
          </span>
          {isOwner && (
            <div className="flex justify-end pt-2">
              <Button
                size="sm"
                variant="destructive"
                className="gap-2"
                onClick={onCancel}
              >
                <XCircle className="h-4 w-4" />
                {request.status === 'approved'
                  ? 'Revoke Access'
                  : 'Cancel Request'}
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (request.status === 'pending') {
    return (
      <Alert className="mb-4 border-yellow-200 dark:border-yellow-800">
        <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <AlertTitle className="text-yellow-800 dark:text-yellow-300">
          Request Pending
        </AlertTitle>
        <AlertDescription className="flex flex-col gap-2 mt-2">
          <span className="text-yellow-700 dark:text-yellow-400">
            Waiting for approval. You will be notified when approved.
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`mr-2 h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              Check Status
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={onCancel}
            >
              <XCircle className="mr-2 h-3 w-3" />
              Cancel Request
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
