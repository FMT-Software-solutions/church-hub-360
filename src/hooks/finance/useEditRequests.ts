import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import type { EditRequest, RequestTableName } from '@/types/finance-requests';
import { toast } from 'sonner';
import { insertFinanceActivityLog } from '@/utils/finance/activityLog';
import type { FinanceEntityType } from '@/types/finance';

export const editRequestKeys = {
  all: ['edit_requests'] as const,
  detail: (table: string, recordId: string) => [...editRequestKeys.all, table, recordId] as const,
  pending: (orgId: string) => [...editRequestKeys.all, 'pending', orgId] as const,
};

async function getRecordMetadata(tableName: RequestTableName, recordId: string) {
    let dbTable = tableName as string;
    if (tableName === 'expense') dbTable = 'expenses';
    if (tableName === 'pledge_payment') dbTable = 'pledge_payments';
    if (tableName === 'pledge_record') dbTable = 'pledge_records';

    const { data } = await supabase
        .from(dbTable)
        .select('*')
        .eq('id', recordId)
        .single();
    
    if (!data) return {};

    const metadata: Record<string, any> = {};

    if (data.amount) {
        metadata['Amount'] = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'GHS' }).format(data.amount);
    }
    
    const dateStr = data.date || data.payment_date || data.created_at;
    if (dateStr) {
        metadata['Date'] = new Date(dateStr).toLocaleDateString();
    }

    if (tableName === 'income') {
        if (data.description) metadata['Description'] = data.description;
        if (data.source) metadata['Source'] = data.source;
        if (data.category) metadata['Category'] = data.category;
        if (data.payment_method) metadata['Payment Method'] = data.payment_method;
    } else if (tableName === 'expense') {
         if (data.description) metadata['Description'] = data.description;
         if (data.vendor) metadata['Vendor'] = data.vendor;
         if (data.category) metadata['Category'] = data.category;
    } else if (tableName === 'pledge_payment') {
        metadata['Type'] = 'Pledge Payment';
        if (data.note) metadata['Note'] = data.note;
    } else if (tableName === 'pledge_record') {
         if (data.campaign_name) metadata['Campaign'] = data.campaign_name;
         if (data.pledge_type) metadata['Pledge Type'] = data.pledge_type;
    }

    return metadata;
}

async function getRecordDetails(tableName: RequestTableName, recordId: string) {
    let dbTable = tableName as string;
    if (tableName === 'expense') dbTable = 'expenses';
    if (tableName === 'pledge_payment') dbTable = 'pledge_payments';
    if (tableName === 'pledge_record') dbTable = 'pledge_records';

    const { data } = await supabase
        .from(dbTable)
        .select('*')
        .eq('id', recordId)
        .single();
    
    if (!data) return '';

    const amount = data.amount ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'GHS' }).format(data.amount) : '';
    const dateStr = data.date || data.payment_date || data.created_at;
    const date = dateStr ? new Date(dateStr).toLocaleDateString() : '';
    
    let desc = '';
    if (tableName === 'income') desc = data.description || data.source || data.category || 'Income';
    else if (tableName === 'expense') desc = data.description || data.vendor || 'Expense';
    else if (tableName === 'pledge_payment') desc = 'Pledge Payment';
    else if (tableName === 'pledge_record') desc = data.campaign_name || data.pledge_type || 'Pledge';

    return `${desc} - ${amount} (${date})`;
}

export function useEditRequest(tableName: RequestTableName, recordId: string) {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;
  const isOwner = currentOrganization?.user_role === 'owner';

  // 1. Fetch Status
  const { data: request, isLoading, refetch } = useQuery({
    queryKey: editRequestKeys.detail(tableName, recordId),
    enabled: !!orgId && !!recordId,
    queryFn: async () => {
      // Find any active request (pending or approved)
      const { data, error } = await supabase
        .from('edit_requests')
        .select('*, requester:profiles!edit_requests_requester_id_fkey1(first_name, last_name)')
        .eq('table_name', tableName)
        .eq('record_id', recordId)
        .in('status', ['pending', 'approved'])
        .maybeSingle();

      if (error) throw error;
      return data as EditRequest | null;
    },
    staleTime: 0,
    gcTime: 0,
  });

  // 2. Request Access
  const requestAccess = useMutation({
    mutationFn: async (reason: string) => {
      if (!user || !orgId) throw new Error("Not authenticated");

      const status = isOwner ? 'approved' : 'pending';
      const reviewer_id = isOwner ? user.id : null;
      const reviewed_at = isOwner ? new Date().toISOString() : null;

      // Create Request
      const { data: newRequest, error } = await supabase
        .from('edit_requests')
        .insert({
          organization_id: orgId,
          table_name: tableName,
          record_id: recordId,
          requester_id: user.id,
          reason,
          status,
          reviewer_id,
          reviewed_at
        })
        .select()
        .single();

      if (error) throw error;

      // Notify Owners (only if pending)
      if (status === 'pending') {
          const { data: owners } = await supabase
            .from('user_organizations')
            .select('user_id')
            .eq('organization_id', orgId)
            .eq('role', 'owner');
          
          if (owners && owners.length >0) {
            const recordDetails = await getRecordDetails(tableName, recordId);
            const recordMetadata = await getRecordMetadata(tableName, recordId);
            const notifications = owners.map(o => ({
                organization_id: orgId,
                recipient_id: o.user_id,
                type: 'edit_request_created',
                title: 'New Edit Request',
                message: `Request to edit ${tableName}: ${recordDetails}. Reason: ${reason}`,
                resource_type: 'edit_request',
                resource_id: newRequest.id,
                metadata: JSON.stringify(recordMetadata)
            }));
            
            await supabase.from('notifications').insert(notifications);
          }
      }
      
      // Log Activity
      await insertFinanceActivityLog({
        organization_id: orgId,
        entity_type: tableName as FinanceEntityType,
        entity_id: recordId,
        action_type: 'request_edit',
        actor_id: user.id,
        metadata: {
             request_id: newRequest.id,
             reason,
             auto_approved: isOwner
        }
      });

      if (status === 'approved') {
           await insertFinanceActivityLog({
            organization_id: orgId,
            entity_type: tableName as FinanceEntityType,
            entity_id: recordId,
            action_type: 'approve_edit',
            actor_id: user.id,
            metadata: {
                 request_id: newRequest.id,
                 auto_approved: true
            }
          });
      }

      return newRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: editRequestKeys.detail(tableName, recordId) });
      queryClient.invalidateQueries({ queryKey: editRequestKeys.pending(orgId || '') });
      if (isOwner) {
          toast.success('Access granted (Auto-approved)');
      } else {
          toast.success('Request sent to owners');
      }
    },
    onError: (err: any) => {
        if (err.message?.includes('one_active_request_per_record') || err.message?.includes('duplicate key')) {
            toast.error('A request is already active for this record.');
            refetch(); // Refresh to show who locked it
        } else {
            toast.error('Failed to send request');
            console.error(err);
        }
    }
  });

  // 3. Cancel Request
  const cancelRequest = useMutation({
    mutationFn: async (requestId: string) => {
        if (!user || !orgId) throw new Error("Not authenticated");
        
        const { data: deleted, error } = await supabase
            .from('edit_requests')
            .delete()
            .eq('id', requestId)
            .select()
            .single();

        if (error) throw error;
        
        const deletedRequest = deleted as unknown as EditRequest;

        // If the user cancelling is NOT the requester, it must be an owner revoking access
        if (deletedRequest && deletedRequest.requester_id !== user.id) {
            const recordDetails = await getRecordDetails(deletedRequest.table_name, deletedRequest.record_id);
            const recordMetadata = await getRecordMetadata(deletedRequest.table_name, deletedRequest.record_id);
            await supabase.from('notifications').insert({
                 organization_id: orgId,
                 recipient_id: deletedRequest.requester_id,
                 type: 'edit_request_revoked',
                 title: 'Edit Access Revoked',
                 message: `Your edit access to ${deletedRequest.table_name} record (${recordDetails}) has been revoked.`,
                 resource_type: 'edit_request',
                 resource_id: requestId,
                 metadata: JSON.stringify(recordMetadata)
             });
        }

        await insertFinanceActivityLog({
            organization_id: orgId,
            entity_type: tableName as FinanceEntityType,
            entity_id: recordId,
            action_type: 'cancel_edit',
            actor_id: user.id,
            metadata: { request_id: requestId }
        });
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: editRequestKeys.detail(tableName, recordId) });
        queryClient.invalidateQueries({ queryKey: editRequestKeys.pending(orgId || '') });
        toast.success('Request cancelled');
    }
  });

  // 4. Complete Request (After Edit)
  const completeRequest = useMutation({
    mutationFn: async (requestId: string) => {
        if (!user || !orgId) throw new Error("Not authenticated");
        const { error } = await supabase
            .from('edit_requests')
            .update({ status: 'completed' })
            .eq('id', requestId);
        if (error) throw error;

        await insertFinanceActivityLog({
            organization_id: orgId,
            entity_type: tableName as FinanceEntityType,
            entity_id: recordId,
            action_type: 'complete_edit',
            actor_id: user.id,
            metadata: { request_id: requestId }
        });
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: editRequestKeys.detail(tableName, recordId) });
    }
  });

  return {
    request,
    isLoading,
    refetch,
    requestAccess,
    cancelRequest,
    completeRequest,
    isRequester: request?.requester_id === user?.id,
    canEdit: request?.requester_id === user?.id && request?.status === 'approved',
    isOwner
  };
}

export function usePendingRequests() {
    const { currentOrganization } = useOrganization();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const orgId = currentOrganization?.id;

    const { data: pendingRequests = [], isLoading } = useQuery({
        queryKey: editRequestKeys.pending(orgId || ''),
        enabled: !!orgId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('edit_requests')
                .select(`
                    *,
                    requester:profiles!edit_requests_requester_id_fkey1(first_name, last_name)
                `)
                .eq('organization_id', orgId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data as EditRequest[];
        }
    });

    const resolveRequest = useMutation({
        mutationFn: async ({ requestId, status, note }: { requestId: string, status: 'approved' | 'rejected', note?: string }) => {
             if (!user) throw new Error("No user");
             if (!orgId) throw new Error("No organization");
             
             // Get request details first to know table/record
             const { data: request } = await supabase
                .from('edit_requests')
                .select('*')
                .eq('id', requestId)
                .single();
                
             if (!request) throw new Error("Request not found");

             // Update request
             const { data: updated, error } = await supabase
                .from('edit_requests')
                .update({
                    status,
                    reviewer_id: user.id,
                    reviewer_note: note,
                    reviewed_at: new Date().toISOString()
                })
                .eq('id', requestId)
                .select()
                .single();
             
             if (error) throw error;

             // Notify Requester
             const recordMetadata = await getRecordMetadata(updated.table_name, updated.record_id);
             await supabase.from('notifications').insert({
                 organization_id: orgId,
                 recipient_id: updated.requester_id,
                 type: `edit_request_${status}`,
                 title: `Edit Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
                 message: `Your request to edit ${updated.table_name} has been ${status}. ${note ? `Note: ${note}` : ''}`,
                 resource_type: 'edit_request',
                 resource_id: requestId,
                 metadata: JSON.stringify(recordMetadata)
             });

             // Log Activity
             await insertFinanceActivityLog({
                 organization_id: orgId,
                 entity_type: updated.table_name as FinanceEntityType,
                 entity_id: updated.record_id,
                 action_type: status === 'approved' ? 'approve_edit' : 'reject_edit',
                 actor_id: user.id,
                 metadata: {
                     request_id: requestId,
                     note
                 }
             });
             
             return updated;
        },
        onSuccess: (updated) => {
            queryClient.invalidateQueries({ queryKey: editRequestKeys.pending(orgId || '') });
            queryClient.invalidateQueries({ queryKey: editRequestKeys.all });
            // Invalidate specific request query used by detail view
            if (updated?.id) {
                queryClient.invalidateQueries({ queryKey: ['edit_request', updated.id] });
                queryClient.invalidateQueries({ queryKey: editRequestKeys.detail(updated.table_name, updated.record_id) });
            }
            toast.success('Request updated');
        }
    });

    return {
        pendingRequests,
        isLoading,
        resolveRequest
    };
}

export function useRequestById(requestId: string | null) {
    const { currentOrganization } = useOrganization();
    const orgId = currentOrganization?.id;

    return useQuery({
        queryKey: ['edit_request', requestId],
        enabled: !!requestId && !!orgId,
        queryFn: async () => {
             const { data, error } = await supabase
                .from('edit_requests')
                .select(`
                    *,
                    requester:profiles!edit_requests_requester_id_fkey1(first_name, last_name)
                `)
                .eq('id', requestId)
                .single();
            if (error) throw error;
            return data as EditRequest;
        }
    });
}
