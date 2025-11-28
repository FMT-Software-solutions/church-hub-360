import { Button } from '@/components/ui/button';
import { useEditRequest } from '@/hooks/finance/useEditRequests';
import type { EditRequest, RequestTableName } from '@/types/finance-requests';
import { RefreshCcw } from 'lucide-react';
import { EditRequestStatusBanner } from './EditRequestStatusBanner';
import { RequestEditForm } from './RequestEditForm';

interface EditRequestLockedViewProps {
  request: EditRequest | null | undefined;
  isLoading: boolean;
  onCheckStatus: () => void;
  tableName: string;
  recordId: string;
}

export function EditRequestLockedView({
  request,
  isLoading,
  onCheckStatus,
  tableName,
  recordId,
}: EditRequestLockedViewProps) {
  const { cancelRequest, isOwner } = useEditRequest(
    tableName as RequestTableName,
    recordId
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground space-y-3">
        <RefreshCcw className="h-6 w-6 animate-spin" />
        <p>Checking edit access...</p>
      </div>
    );
  }

  if (request) {
    return (
      <div className="space-y-6">
        <EditRequestStatusBanner
          request={request}
          onRefresh={onCheckStatus}
          onCancel={() => cancelRequest.mutate(request.id)}
          isRefreshing={isLoading}
          isOwner={isOwner}
        />

        <div className="flex flex-col gap-2 p-4 bg-muted/50 rounded-lg border border-border/50">
          <h4 className="text-sm font-medium">Request Status</h4>
          <p className="text-sm text-muted-foreground">
            {request.status === 'pending'
              ? 'Your request is awaiting approval. You will be notified once an owner reviews it.'
              : 'This record is currently locked by another user.'}
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onCheckStatus} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Check Status
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RequestEditForm
        tableName={tableName as any}
        recordId={recordId}
        onSuccess={onCheckStatus}
      />
    </div>
  );
}
