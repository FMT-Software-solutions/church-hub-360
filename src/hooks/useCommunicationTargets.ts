import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface CommunicationTarget {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface TargetFilters {
  selectAll: boolean;
  groupIds: string[];
  tagItemIds: string[];
  individualIds: string[];
}

export function useCommunicationTargets(filters: TargetFilters) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['communication-targets', currentOrganization?.id, filters],
    queryFn: async (): Promise<CommunicationTarget[]> => {
      if (!currentOrganization?.id) return [];
      
      // If we don't need all members, and no specific filters are provided, return empty array
      if (!filters.selectAll && filters.groupIds.length === 0 && filters.tagItemIds.length === 0 && filters.individualIds.length === 0) {
        return [];
      }

      const { data, error } = await supabase.rpc('get_communication_targets', {
        p_organization_id: currentOrganization.id,
        p_select_all: filters.selectAll,
        p_group_ids: filters.groupIds,
        p_tag_item_ids: filters.tagItemIds,
        p_individual_ids: filters.individualIds
      });

      if (error) {
        console.error('Error fetching communication targets:', error);
        throw error;
      }

      return data as CommunicationTarget[];
    },
    enabled: !!currentOrganization?.id && (filters.selectAll || filters.groupIds.length > 0 || filters.tagItemIds.length > 0 || filters.individualIds.length > 0),
  });
}
