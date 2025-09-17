import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabase';

import { useOrganization } from '../../contexts/OrganizationContext';

import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '../ui/badge';
import { Eye, EyeOff, UserCheck, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { UserRole } from '@/lib/auth';
import { useRoleCheck } from '@/components/auth/RoleGuard';

interface InactiveUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  user_organizations?: Array<{
    organization_id: string;
    role: UserRole;
    is_active: boolean;
    organizations: { name: string };
  }>;
  user_branches?: Array<{
    branch_id: string;
    branch: {
      name: string;
    };
  }>;
}

export default function InactiveUsersSection() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  const { isOwner, hasRole } = useRoleCheck();
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<InactiveUser | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch inactive users (owner only)
  const { data: inactiveUsers, isLoading: inactiveUsersLoading } = useQuery({
    queryKey: ['inactive-users', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) {
        throw new Error('User not associated with any organization');
      }

      // Get all inactive users in the same organization
      const { data: orgUsers, error: orgUsersError } = await supabase
        .from('user_organizations')
        .select('user_id')
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', false);

      if (orgUsersError) throw orgUsersError;

      const userIds = orgUsers?.map((ou) => ou.user_id) || [];

      // Build query for inactive profiles with organization and branch data
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(
          `
          *,
          user_organizations!inner(
            organization_id,
            role,
            is_active,
            organizations(
              name
            )
          ),
          user_branches(
            branch_id,
            branches(
              name
            )
          )
        `
        )
        .in('id', userIds)
        .eq('user_organizations.organization_id', currentOrganization.id)
        .eq('user_organizations.is_active', false)
        .order('first_name');

      if (profilesError) throw profilesError;

      return profilesData as InactiveUser[];
    },
    enabled: isOwner() && !!currentOrganization,
  });

  // Reactivate user mutation
  const reactivateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Get current session for authorization
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) throw new Error('No access token');

      // Call the reactivate-user edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reactivate-user`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            organizationId: currentOrganization?.id || '',
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reactivate user');
      }

      const result = await response.json();

      // Activity logging would be handled by edge function

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['inactive-users'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      toast.success('User reactivated successfully!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Only render if user is owner
  if (!hasRole(['owner'])) {
    return null;
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-md font-semibold text-muted-foreground">
            Inactive Users
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInactiveUsers(!showInactiveUsers)}
          className="text-muted-foreground hover:text-foreground"
        >
          {showInactiveUsers ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Hide
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Show ({inactiveUsers?.length || 0})
            </>
          )}
        </Button>
      </div>

      {showInactiveUsers && (
        <div className="space-y-4">
          {inactiveUsersLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading inactive users...
            </div>
          ) : inactiveUsers && inactiveUsers.length > 0 ? (
            <div className="grid gap-4">
              {inactiveUsers.map((user) => (
                <Card
                  key={user.id}
                  className="border-dashed border-muted-foreground/30"
                >
                  <CardContent>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-col md:flex-row md:items-center items-start md:space-x-2">
                          <h3 className="font-semibold text-muted-foreground">
                            {user.first_name && user.last_name
                              ? `${user.first_name} ${user.last_name}`
                              : user.email}
                          </h3>
                          <Badge variant="secondary" className="bg-muted">
                            {user.user_organizations?.[0]?.role || 'User'}
                          </Badge>
                          <Badge variant="destructive" className="text-xs">
                            Inactive
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        {user.user_branches &&
                          user.user_branches.length > 0 &&
                          user.user_branches[0].branch && (
                            <p className="text-sm text-muted-foreground">
                              Branch: {user.user_branches[0].branch.name}
                            </p>
                          )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={reactivateUserMutation.isPending}
                          className="border-green-200 text-green-700 hover:bg-green-50"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsDialogOpen(true);
                          }}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Reactivate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No inactive users found.
            </div>
          )}
        </div>
      )}

      {/* Single reusable dialog instance */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reactivate "
              {selectedUser?.first_name && selectedUser?.last_name
                ? `${selectedUser.first_name} ${selectedUser.last_name}`
                : selectedUser?.email}
              "? This will restore their access to this organization again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDialogOpen(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedUser) {
                  reactivateUserMutation.mutate(selectedUser.id);
                  setIsDialogOpen(false);
                  setSelectedUser(null);
                }
              }}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Reactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
