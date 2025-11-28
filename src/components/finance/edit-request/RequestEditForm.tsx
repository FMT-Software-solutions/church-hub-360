import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useEditRequest } from '@/hooks/finance/useEditRequests';
import type { RequestTableName } from '@/types/finance-requests';

interface RequestEditFormProps {
  tableName: RequestTableName;
  recordId: string;
  onSuccess?: () => void;
}

export function RequestEditForm({
  tableName,
  recordId,
  onSuccess,
}: RequestEditFormProps) {
  const [reason, setReason] = useState('');
  const { requestAccess } = useEditRequest(tableName, recordId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) {
      requestAccess.mutate(reason, {
        onSuccess: () => {
          onSuccess?.();
        },
      });
    }
  };

  const isSubmitting = requestAccess.isPending;

  return (
    <div className="p-6 flex flex-col items-center justify-center text-center space-y-4 bg-muted/20 rounded-lg border border-dashed">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Edit Access Required</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Finance records are locked by default to ensure data integrity. Please
          request access to make changes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="space-y-2 text-left">
          <Label htmlFor="reason">Reason for edit</Label>
          <Textarea
            id="reason"
            placeholder="e.g. Correcting amount, changing category..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            className="min-h-[100px]"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={!reason.trim() || isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Request Edit Access
        </Button>
      </form>
    </div>
  );
}
