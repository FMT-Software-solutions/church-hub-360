import { useRoleCheck } from '@/components/auth/RoleGuard';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Search, UserPlus } from 'lucide-react';
import InactiveUsersSection from '@/components/user-management/InactiveUsersSection';
import { UserTable } from '@/components/user-management/UserTable';
import { UserGrid } from '@/components/user-management/UserGrid';
import { UserDisplayControls } from '@/components/user-management/UserDisplayControls';
import { UserPagination } from '@/components/user-management/UserPagination';
import { UserForm } from '@/components/user-management/UserForm';
import { UserActionDialogs } from '@/components/user-management/UserActionDialogs';
import { useUsersPreferences } from '@/hooks/useUsersPreferences';
import { useUserQueries } from '@/hooks/useUserQueries';
import { useUserActions } from '@/hooks/useUserActions';
import { useOrganization } from '@/contexts/OrganizationContext';
import { detectUserChanges, transformUserUpdateData, logUserChanges } from '@/utils/user-update-utils';
import type { UserAction, UserWithRelations } from '@/types/user-management';

export default function UserManagement() {
  const { canManageBranchData } = useRoleCheck();
  const { currentOrganization } = useOrganization();

  // State for dialogs and forms
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRelations | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');

  // User preferences and filters
  const {
    displayMode,
    setDisplayMode,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    filters,
    sortBy,
    sortOrder,
  } = useUsersPreferences();

  // Data fetching
  const {
    users,
    branches,
    isLoading,
    createUser,
    updateUser,
  } = useUserQueries();

  // User actions
  const userActions = useUserActions();

  // Event handlers
  const handleUserActionLocal = (action: UserAction, user: any) => {
    switch (action) {
      case 'edit':
        setEditingUser(user);
        setIsEditDialogOpen(true);
        break;
      case 'deactivate':
        // Show confirmation dialog for deactivation
        if ((window as any).userActionDialogs) {
          (window as any).userActionDialogs.openDeactivateDialog({
            id: user.id,
            email: user.profile?.email || '',
            full_name: `${user.profile?.first_name || ''} ${user.profile?.last_name || ''}`.trim(),
            role: user.user_organizations?.[0]?.role || 'read',
            is_active: user.is_active
          });
        } else {
          // Fallback to direct action if dialog not available
          userActions.handleUserAction(action, user, currentOrganization?.id);
        }
        break;
      default:
        userActions.handleUserAction(action, user, currentOrganization?.id);
        break;
    }
  };

  const handleCreateUser = (userData: any) => {
    // Transform the form data to include branch assignments
    const transformedData = {
      ...userData,
      // Handle branch assignments based on role and form data
      branchIds: userData.assignAllBranches
        ? branches?.filter((b) => b.is_active).map((b) => b.id) || []
        : userData.selectedBranchIds ||
          (userData.branchId ? [userData.branchId] : []),
      // Remove the form-specific fields
      assignAllBranches: undefined,
      selectedBranchIds: undefined,
    };

    createUser.mutate(transformedData, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        toast.success('User created successfully!');
      },
      onError: (error) => {
        console.error('Error creating user:', error);
        toast.error('Failed to create user');
      },
    });
  };

  const handleUpdateUser = (userData: any) => {
    if (!editingUser) return;

    // Get active branch IDs for change detection
    const activeBranchIds = branches?.filter((b) => b.is_active).map((b) => b.id) || [];

    // Detect what has actually changed
    const changes = detectUserChanges(editingUser, userData, activeBranchIds);
    
    // Log changes for debugging
    logUserChanges(changes, editingUser.id);

    // If no changes detected, show message and return
    if (!changes.hasAnyChanges) {
      toast.info('No changes detected');
      return;
    }

    // Transform the form data for the API
    const transformedData = transformUserUpdateData(userData, activeBranchIds);

    updateUser.mutate(
      {
        authUserId: editingUser.id,
        // profileId removed - now using unified IDs where authUserId is the same as profileId
        userData: transformedData,
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          setEditingUser(null);
          toast.success('User updated successfully');
        },
        onError: (error) => {
          console.error('Error updating user:', error);
          toast.error('Failed to update user');
        },
      }
    );
  };

  // Filter and search users
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    return users.filter((user: any) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${user.profile.first_name || ''} ${
          user.profile.last_name || ''
        }`.toLowerCase();
        const email = user.profile.email?.toLowerCase() || '';

        if (!fullName.includes(searchLower) && !email.includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (filters.status === 'active' && !user.is_active) return false;
      if (filters.status === 'inactive' && user.is_active) return false;

      // Role filter
      if (filters.role) {
        const userRole = user.user_organizations?.[0]?.role;
        if (userRole !== filters.role) return false;
      }

      // Branch filter
      if (filters.branchId) {
        const userBranches = user.user_branches || [];
        const hasBranch = userBranches.some(
          (ub: any) => ub.branch_id === filters.branchId
        );
        if (!hasBranch) return false;
      }

      return true;
    });
  }, [users, searchTerm, filters]);

  // Sort users
  const sortedUsers = useMemo(() => {
    if (!filteredUsers.length) return [];

    return [...filteredUsers].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'full_name':
          aValue = `${a.profile.first_name || ''} ${
            a.profile.last_name || ''
          }`.toLowerCase();
          bValue = `${b.profile.first_name || ''} ${
            b.profile.last_name || ''
          }`.toLowerCase();
          break;
        case 'email':
          aValue = a.profile.email?.toLowerCase() || '';
          bValue = b.profile.email?.toLowerCase() || '';
          break;

        case 'created_at':
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        case 'last_login':
          aValue = new Date(a.last_login || 0);
          bValue = new Date(b.last_login || 0);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortBy, sortOrder]);

  // Paginate users
  const totalUsers = sortedUsers.length;
  const totalPages = Math.ceil(totalUsers / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

  // Event handlers

  // Access control check
  if (!canManageBranchData()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access user management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage users and their permissions
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 md:mt-0">
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the platform. They will receive login
                credentials via email.
              </DialogDescription>
            </DialogHeader>
            <UserForm
              mode="create"
              onSubmit={handleCreateUser}
              onCancel={() => setIsCreateDialogOpen(false)}
              branches={branches || []}
              isLoading={createUser.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        <UserDisplayControls
          displayMode={displayMode}
          onDisplayModeChange={setDisplayMode}
        />
      </div>

      {/* User Display */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading users...</p>
        </div>
      ) : (
        <>
          {displayMode === 'table' ? (
            <UserTable
              users={paginatedUsers}
              onUserAction={handleUserActionLocal}
              branches={branches}
            />
          ) : (
            <UserGrid
              users={paginatedUsers}
              onUserAction={handleUserActionLocal}
              branches={branches}
            />
          )}

          {/* Pagination */}
          <UserPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalUsers}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      {/* Inactive Users Section */}
      <InactiveUsersSection />

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <UserForm
              mode="edit"
              user={editingUser}
              onSubmit={handleUpdateUser}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingUser(null);
              }}
              branches={branches || []}
              isLoading={updateUser.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* User Action Dialogs */}
      <UserActionDialogs
        onPasswordRegenerated={(tempPassword) => {
          toast.success(`Temporary password generated: ${tempPassword}`);
        }}
      />
    </div>
  );
}
