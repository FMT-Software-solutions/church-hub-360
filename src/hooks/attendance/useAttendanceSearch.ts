import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';

export const attendanceSearchKeys = {
  all: ['attendance-search'] as const,
  occasions: (orgId: string | undefined, term: string, limit: number) =>
    [...attendanceSearchKeys.all, 'occasions', orgId, term, limit] as const,
  occasionDetails: (orgId: string | undefined, ids: string[]) =>
    [...attendanceSearchKeys.all, 'occasion-details', orgId, ...ids.sort()] as const,
  sessions: (orgId: string | undefined, term: string, limit: number, occasionId?: string) =>
    [...attendanceSearchKeys.all, 'sessions', orgId, term, limit, occasionId] as const,
  sessionDetails: (orgId: string | undefined, ids: string[]) =>
    [...attendanceSearchKeys.all, 'session-details', orgId, ...ids.sort()] as const,
};

export interface OccasionSearchResult {
  id: string;
  display_name: string;
  display_subtitle?: string;
}

export interface SessionSearchResult {
  id: string;
  display_name: string;
  display_subtitle?: string;
}

export function useOccasionSearch(searchTerm: string, limit: number = 10) {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: attendanceSearchKeys.occasions(currentOrganization?.id, searchTerm, limit),
    queryFn: async (): Promise<OccasionSearchResult[]> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!searchTerm.trim()) return [];

      const term = searchTerm.trim().toLowerCase();

      let query = supabase
        .from('attendance_occasions')
        .select('id, name, description')
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false)
        .or(`name.ilike.%${term}%,description.ilike.%${term}%`)
        .order('name', { ascending: true })
        .limit(limit);

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((o: any) => ({
        id: o.id,
        display_name: o.name || 'Occasion',
        display_subtitle: o.description || undefined,
      }));
    },
    enabled: !!currentOrganization?.id && !!searchTerm.trim(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useOccasionDetails(ids: string[]) {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: attendanceSearchKeys.occasionDetails(currentOrganization?.id, ids),
    queryFn: async (): Promise<OccasionSearchResult[]> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!ids.length) return [];
      const { data, error } = await supabase
        .from('attendance_occasions')
        .select('id, name, description')
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false)
        .in('id', ids);
      if (error) throw error;
      return (data || []).map((o: any) => ({
        id: o.id,
        display_name: o.name || 'Occasion',
        display_subtitle: o.description || undefined,
      }));
    },
    enabled: !!currentOrganization?.id && ids.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useSessionSearch(searchTerm: string, limit: number = 10, occasionId?: string) {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: attendanceSearchKeys.sessions(currentOrganization?.id, searchTerm, limit, occasionId),
    queryFn: async (): Promise<SessionSearchResult[]> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!searchTerm.trim()) return [];

      const term = searchTerm.trim().toLowerCase();

  let query = supabase
    .from('attendance_sessions')
    .select('id, name, start_time, attendance_occasions(name)')
    .eq('organization_id', currentOrganization.id)
    .eq('is_deleted', false)
    .order('start_time', { ascending: false })
    .limit(limit);

  // Only past or closed sessions should be searchable/visible
  const nowIso = new Date().toISOString();
  query = query.or(`end_time.lte.${nowIso},and(is_open.eq.false,start_time.lte.${nowIso})`);

      if (occasionId) {
        query = query.eq('occasion_id', occasionId);
      }

      // Name search only for now (start_time is datetime)
      query = query.or(`name.ilike.%${term}%`);

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((s: any) => ({
        id: s.id,
        display_name: s.name || new Date(s.start_time).toLocaleString(),
        display_subtitle: s.attendance_occasions?.name || undefined,
      }));
    },
    enabled: !!currentOrganization?.id && !!searchTerm.trim(),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useSessionDetails(ids: string[]) {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: attendanceSearchKeys.sessionDetails(currentOrganization?.id, ids),
    queryFn: async (): Promise<SessionSearchResult[]> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!ids.length) return [];
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('id, name, start_time, attendance_occasions(name)')
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false)
        .in('id', ids);
      if (error) throw error;
      return (data || []).map((s: any) => ({
        id: s.id,
        display_name: s.name || new Date(s.start_time).toLocaleString(),
        display_subtitle: s.attendance_occasions?.name || undefined,
      }));
    },
    enabled: !!currentOrganization?.id && ids.length > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}