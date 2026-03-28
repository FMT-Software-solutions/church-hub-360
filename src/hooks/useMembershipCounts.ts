import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface MembershipCounts {
  total_active: number;
  total_in_any_group: number;
  total_in_any_tag: number;
  groups: Record<string, number>;
  tag_categories: Record<string, number>;
  tag_items: Record<string, number>;
}

export function useMembershipCounts() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['membership-counts', currentOrganization?.id],
    queryFn: async (): Promise<MembershipCounts> => {
      if (!currentOrganization?.id) {
        return {
          total_active: 0,
          total_in_any_group: 0,
          total_in_any_tag: 0,
          groups: {},
          tag_categories: {},
          tag_items: {}
        };
      }

      const { data, error } = await supabase.rpc('get_membership_counts', {
        p_organization_id: currentOrganization.id
      });

      if (error) {
        console.error('Error fetching membership counts:', error);
        throw error;
      }

      return data as MembershipCounts;
    },
    enabled: !!currentOrganization?.id,
  });
}
