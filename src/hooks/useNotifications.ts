import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import type { AppNotification } from '@/types/finance-requests';

export const notificationKeys = {
  all: ['notifications'] as const,
  unread: (orgId: string, userId: string) => [...notificationKeys.all, 'unread', orgId, userId] as const,
  list: (orgId: string, userId: string, page: number, pageSize: number, filter: string) => 
    [...notificationKeys.all, 'list', orgId, userId, page, pageSize, filter] as const,
  detail: (id: string) => [...notificationKeys.all, 'detail', id] as const,
};

export function useNotification(id: string | null) {
  return useQuery({
    queryKey: notificationKeys.detail(id || ''),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as AppNotification;
    }
  });
}

export function useNotifications() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const orgId = currentOrganization?.id;
  const userId = user?.id;

  const { data: unreadNotifications = [], isLoading, refetch } = useQuery({
    queryKey: notificationKeys.unread(orgId || '', userId || ''),
    enabled: !!orgId && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('organization_id', orgId)
        .eq('recipient_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AppNotification[];
    },
    refetchInterval: 30000, // Poll every 30s
  });

  const markAsRead = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      if (!notificationIds.length) return;
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', notificationIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  return {
    unreadNotifications,
    isLoading,
    markAsRead,
    refetch,
  };
}

export function useAllNotifications({
    page = 1,
    pageSize = 20,
    filter = 'all' // 'all', 'unread', 'read'
}: {
    page?: number;
    pageSize?: number;
    filter?: 'all' | 'unread' | 'read';
} = {}) {
    const { currentOrganization } = useOrganization();
    const { user } = useAuth();
    const orgId = currentOrganization?.id;
    const userId = user?.id;

    const { data, isLoading, refetch } = useQuery({
        queryKey: notificationKeys.list(orgId || '', userId || '', page, pageSize, filter),
        enabled: !!orgId && !!userId,
        queryFn: async () => {
            let query = supabase
                .from('notifications')
                .select('*', { count: 'exact' })
                .eq('organization_id', orgId)
                .eq('recipient_id', userId)
                .order('created_at', { ascending: false })
                .range((page - 1) * pageSize, page * pageSize - 1);

            if (filter === 'unread') {
                query = query.eq('is_read', false);
            } else if (filter === 'read') {
                query = query.eq('is_read', true);
            }

            const { data, count, error } = await query;
            if (error) throw error;
            
            return {
                data: data as AppNotification[],
                count: count || 0
            };
        }
    });

    return { data, isLoading, refetch };
}
