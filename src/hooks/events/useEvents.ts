import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleCheck } from '@/registry/access/RoleGuard';
import { useUserBranches } from '@/hooks/useBranchQueries';
import { toast } from 'sonner';
import type {
  EventActivity,
  CreateEventActivityInput,
  UpdateEventActivityInput,
  EventActivityWithRelations,
  EventActivityFilters,
  EventActivitySort,
  EventActivityStatus,
} from '@/types/events';

export const eventsKeys = {
  all: ['events-activities'] as const,
  lists: () => [...eventsKeys.all, 'list'] as const,
  list: (organizationId: string, filters?: EventActivityFilters) =>
    [...eventsKeys.lists(), organizationId, filters] as const,
  details: () => [...eventsKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventsKeys.details(), id] as const,
};

function getEventStatus(evt: Pick<EventActivity, 'start_time' | 'end_time' | 'is_active'>): EventActivityStatus {
  const now = new Date();
  const start = new Date(evt.start_time);
  const end = evt.end_time ? new Date(evt.end_time) : null;

  if (now < start) return 'upcoming';
  if (evt.is_active && (!end || now <= end)) return 'ongoing';
  return 'past';
}

export function useEvents(filters?: EventActivityFilters, sort?: EventActivitySort) {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const { canManageAllData } = useRoleCheck();
  const { data: userBranches = [] } = useUserBranches(user?.id, currentOrganization?.id);
  const assignedBranchIds = (userBranches || []).map((ub: any) => ub.branch_id).filter(Boolean) as string[];

  return useQuery({
    queryKey: eventsKeys.list(currentOrganization?.id || '', filters),
    queryFn: async (): Promise<EventActivityWithRelations[]> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');

      let query = supabase
        .from('events_activities')
        .select(`*, profiles!events_activities_created_by_fkey1(first_name,last_name), branches(name)`) // creator and branch name
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (filters?.branch_id) query = query.or(`branch_id.eq.${filters.branch_id},branch_id.is.null`);
      if (filters?.type) query = query.eq('type', filters.type);
      if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
      if (filters?.search) query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      if (filters?.date_from && filters?.date_to) {
        const fromIso = filters.date_from;
        const toIso = filters.date_to;
        query = query
          .lte('start_time', toIso)
          .or(`end_time.is.null,end_time.gte.${fromIso}`);
      } else if (filters?.date_from) {
        const fromIso = filters.date_from;
        query = query.or(`end_time.is.null,end_time.gte.${fromIso}`);
      } else if (filters?.date_to) {
        const toIso = filters.date_to;
        query = query.lte('start_time', toIso);
      }

      if (sort) {
        query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      } else {
        query = query.order('start_time', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((evt: any) => ({
        ...evt,
        branch_name: evt.branches?.name || null,
        created_by_name:
          evt.profiles?.first_name && evt.profiles?.last_name
            ? `${evt.profiles.first_name} ${evt.profiles.last_name}`
            : null,
        status: getEventStatus(evt),
      })).filter((evt) => {
        if (!filters?.branch_id && !canManageAllData()) {
          if (assignedBranchIds.length === 0) return false;
          if (evt.branch_id == null) return true;
          if (typeof evt.branch_id === 'string') return assignedBranchIds.includes(evt.branch_id);
        }
        if (filters?.status) return evt.status === filters.status;
        return true;
      });
    },
    enabled: !!currentOrganization?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useEvent(id: string) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: eventsKeys.detail(id),
    queryFn: async (): Promise<EventActivityWithRelations> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');

      const { data, error } = await supabase
        .from('events_activities')
        .select(`*, profiles!events_activities_created_by_fkey1(first_name,last_name), branches(name)`) 
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Event not found');
      const status = getEventStatus(data);
      return {
        ...data,
        branch_name: (data as any).branches?.name || null,
        created_by_name:
          (data as any).profiles?.first_name && (data as any).profiles?.last_name
            ? `${(data as any).profiles.first_name} ${(data as any).profiles.last_name}`
            : null,
        status,
      };
    },
    enabled: !!currentOrganization?.id && !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateEventActivityInput): Promise<EventActivity> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!user?.id) throw new Error('User authentication required');

      const payload = {
        ...input,
        organization_id: currentOrganization.id,
        created_by: user.id,
        type: input.type ?? 'event',
        all_day: input.all_day ?? false,
        remind_method: input.remind_method ?? 'none',
        is_active: input.is_active ?? true,
      };

      const { data, error } = await supabase
        .from('events_activities')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventsKeys.lists() });
      toast.success('Event/activity created successfully');
    },
    onError: (error) => {
      console.error('Error creating event/activity:', error);
      toast.error('Failed to create event/activity');
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateEventActivityInput }): Promise<EventActivity> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      const { data, error } = await supabase
        .from('events_activities')
        .update({ ...updates, last_updated_by: user?.id || null })
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: eventsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventsKeys.detail(data.id) });
      toast.success('Event/activity updated successfully');
    },
    onError: (error) => {
      console.error('Error updating event/activity:', error);
      toast.error('Failed to update event/activity');
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      const { error } = await supabase
        .from('events_activities')
        .update({ is_deleted: true, last_updated_by: user?.id || null })
        .eq('id', id)
        .eq('organization_id', currentOrganization.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventsKeys.lists() });
      toast.success('Event/activity deleted');
    },
    onError: (error) => {
      console.error('Error deleting event/activity:', error);
      toast.error('Failed to delete event/activity');
    },
  });
}

export function useToggleEventActive() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }): Promise<EventActivity> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      const { data, error } = await supabase
        .from('events_activities')
        .update({ is_active: isActive, last_updated_by: user?.id || null })
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventsKeys.lists() });
      toast.success('Event/activity status updated');
    },
    onError: (error) => {
      console.error('Error updating event/activity status:', error);
      toast.error('Failed to update status');
    },
  });
}
