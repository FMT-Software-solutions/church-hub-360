import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';

import type { UserAction } from '@/types/user-management';
import type { UserWithRelations } from '@/types/user-management';

export function useUserActions() {
  const queryClient = useQueryClient();

  // Deactivate user mutation
  const deactivateUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) throw new Error('No access token');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to deactivate user');
      }

      // Activity logging would be handled by edge function

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['inactive-users'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      // Toast notification handled in component
    },
    onError: () => {
        // Error handling in component
      },
  });

  // Reactivate user mutation
  const reactivateUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) throw new Error('No access token');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reactivate-user`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reactivate user');
      }

      // Activity logging would be handled by edge function

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['inactive-users'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      // Toast notification handled in component
    },
    onError: () => {
        // Error handling in component
      },
  });

  // Regenerate password mutation
  const regeneratePassword = useMutation({
    mutationFn: async (userId: string) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) throw new Error('No access token');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/regenerate-password`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to regenerate password');
      }

      const result = await response.json();

      // Activity logging would be handled by edge function

      return result;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['users'] });
        queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        // Toast notification handled in component
      },
      onError: () => {
        // Error handling in component
      },
  });

  // Delete user permanently mutation
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) throw new Error('No access token');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user-permanent`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user permanently');
      }

      // Activity logging would be handled by edge function

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['inactive-users'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      // Toast notification handled in component
    },
    onError: () => {
        // Error handling in component
      },
  });

  const handleUserAction = async (action: UserAction, user: UserWithRelations) => {
    try {
      switch (action) {
        case 'deactivate':
          await deactivateUser.mutateAsync(user.id);
          break;
        case 'reactivate':
          await reactivateUser.mutateAsync(user.id);
          break;
        case 'regenerate-password':
          await regeneratePassword.mutateAsync(user.id);
          break;
        case 'delete':
          await deleteUser.mutateAsync(user.id);
          break;
        default:
          console.warn(`Unhandled user action: ${action}`);
      }
    } catch (error) {
      console.error('User action failed:', error);
    }
  };

  return {
    handleUserAction,
    deactivateUser,
    reactivateUser,
    regeneratePassword,
    deleteUser,
  };
}