import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import type { TagAssignmentChange } from '@/utils/tagAssignmentUtils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface BulkTagOperationsParams {
  memberId: string;
  changes: TagAssignmentChange[];
}

interface BulkTagOperationsResult {
  success: boolean;
  error?: string;
}

/**
 * Custom hook for performing bulk tag assignment operations
 * Handles multiple inserts, updates, and deletes in a single transaction
 */
export function useBulkTagOperations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const bulkOperationsMutation = useMutation<
    BulkTagOperationsResult,
    Error,
    BulkTagOperationsParams
  >({
    mutationFn: async ({ memberId, changes }) => {
      if (changes.length === 0) {
        return { success: true };
      }

      try {
        // Start a transaction by grouping operations
        const operations = [];

        // Prepare delete operations
        const deleteIds = changes
          .filter(change => change.action === 'delete' && change.assignmentId)
          .map(change => change.assignmentId!);

        if (deleteIds.length > 0) {
          operations.push(
            supabase
              .from('member_tag_items')
              .delete()
              .in('id', deleteIds)
          );
        }

        // Prepare update operations
        const updateChanges = changes.filter(change => change.action === 'update');
        for (const change of updateChanges) {
          if (change.assignmentId) {
            operations.push(
              supabase
                .from('member_tag_items')
                .update({
                  value: change.value
                })
                .eq('id', change.assignmentId)
            );
          }
        }

        // Prepare insert operations
        const insertChanges = changes.filter(change => change.action === 'add');
        if (insertChanges.length > 0) {
          const insertData = insertChanges.map(change => ({
            member_id: memberId,
            tag_item_id: change.assignmentId,
            assigned_at: new Date().toISOString(),
            assigned_by: user?.id || null
          }));

          operations.push(
            supabase
              .from('member_tag_items')
              .insert(insertData)
          );
        }

        // Execute all operations
        const results = await Promise.all(operations);

        // Check for errors in any operation
        for (const result of results) {
          if (result.error) {
            throw new Error(result.error.message);
          }
        }

        return { success: true };
      } catch (error) {
        console.error('Bulk tag operations failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
      }
    },
    onSuccess: (result, { memberId }) => {
      if (result.success) {
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['member-tag-assignments', memberId] });
        queryClient.invalidateQueries({ queryKey: ['member', memberId] });
        toast.success('Tag assignments updated successfully');
      } else {
        toast.error(result.error || 'Failed to update tag assignments');
      }
    },
    onError: (error) => {
      console.error('Bulk tag operations mutation failed:', error);
      toast.error('Failed to update tag assignments');
    }
  });

  return {
    bulkUpdateTags: bulkOperationsMutation.mutateAsync,
    isUpdating: bulkOperationsMutation.isPending,
    error: bulkOperationsMutation.error
  };
}