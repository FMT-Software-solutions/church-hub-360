import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import type {
  AttendanceLocationRecord,
  CreateAttendanceLocationInput,
} from '@/types/attendance';
import { supabase } from '@/utils/supabase';
import { attendanceSessionKeys } from './useAttendanceSessions';

export const attendanceLocationKeys = {
  all: ['attendance-locations'] as const,
  list: (organizationId: string) =>
    [...attendanceLocationKeys.all, 'list', organizationId] as const,
};

export function useAttendanceLocations() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: attendanceLocationKeys.list(currentOrganization?.id || ''),
    queryFn: async (): Promise<AttendanceLocationRecord[]> => {
      if (!currentOrganization?.id) {
        throw new Error('Organization ID is required');
      }

      const { data, error } = await supabase
        .from('attendance_locations')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('branch_id', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    },
    enabled: !!currentOrganization?.id,
  });
}

type SaveAttendanceLocationInput = Omit<CreateAttendanceLocationInput, 'organization_id'> & {
  id?: string;
};

export function useSaveAttendanceLocation() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      input: SaveAttendanceLocationInput
    ): Promise<AttendanceLocationRecord> => {
      if (!currentOrganization?.id) {
        throw new Error('Organization ID is required');
      }

      const payload = {
        branch_id: input.branch_id ?? null,
        lat: input.lat,
        lng: input.lng,
        radius: input.radius ?? 100,
        country: input.country?.trim() || null,
        city: input.city?.trim() || null,
        state_region: input.state_region?.trim() || null,
        street: input.street?.trim() || null,
        full_address: input.full_address?.trim() || null,
        last_updated_by: user?.id ?? null,
      };

      if (input.id) {
        const { data, error } = await supabase
          .from('attendance_locations')
          .update(payload)
          .eq('id', input.id)
          .eq('organization_id', currentOrganization.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        return data;
      }

      const { data, error } = await supabase
        .from('attendance_locations')
        .insert({
          ...payload,
          organization_id: currentOrganization.id,
          created_by: user?.id ?? null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: attendanceLocationKeys.list(currentOrganization?.id || ''),
      });
      queryClient.invalidateQueries({
        queryKey: attendanceSessionKeys.all,
      });
      toast.success('Attendance proximity settings saved successfully');
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to save attendance proximity settings';
      toast.error(message);
    },
  });
}
