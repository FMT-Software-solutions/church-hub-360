import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MoreHorizontal,
  Edit,
  UserCheck,
  UserX,
  Key,
  Trash2,
  Lock,
} from 'lucide-react';
import { format } from 'date-fns';
import { useRoleCheck } from '@/components/auth/RoleGuard';
import { ROLE_DISPLAY_NAMES } from '@/types/organizations';
import type { UserWithRelations, UserAction } from '@/types/user-management';
import { getFullName } from '@/types/user-management';

interface UserTableProps {
  users: UserWithRelations[];
  isLoading?: boolean;
  onUserAction?: (action: UserAction, user: UserWithRelations) => void;
  branches?: any[]; // Available branches for comparison
}

export function UserTable({
  users,
  isLoading,
  onUserAction,
  branches = [],
}: UserTableProps) {
  const { canManageAllData } = useRoleCheck();
  const isAdmin = canManageAllData();

  const handleAction = (action: UserAction, user: UserWithRelations) => {
    onUserAction?.(action, user);
  };

  const getUserInitials = (user: UserWithRelations) => {
    const fullName = getFullName(user.profile);
    return fullName
      .split(' ')
      .map((name) => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserRole = (user: UserWithRelations) => {
    const userOrg = user.user_organizations?.[0];
    return userOrg?.role || 'read';
  };

  const getUserBranches = (user: UserWithRelations) => {
    const userBranches = user.user_branches || [];
    const activeBranches = branches.filter((b) => b.is_active);

    // Check if user has all active branches assigned
    if (
      activeBranches.length > 0 &&
      userBranches.length === activeBranches.length
    ) {
      const userBranchIds = new Set(userBranches.map((ub) => ub.branch_id));
      const hasAllBranches = activeBranches.every((b) =>
        userBranchIds.has(b.id)
      );

      if (hasAllBranches) {
        return 'All Branches';
      }
    }

    const branchNames = userBranches
      .filter((ub) => ub.branch)
      .map((ub) => ub.branch!.name)
      .join(', ');
    return branchNames || '-';
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branches</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-gray-100 animate-pulse rounded-full" />
                    <div className="h-4 w-24 bg-gray-100 animate-pulse rounded" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-32 bg-gray-100 animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-16 bg-gray-100 animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-20 bg-gray-100 animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-16 bg-gray-100 animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-20 bg-gray-100 animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-8 bg-gray-100 animate-pulse rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branches</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isInactive = !user.is_active;
              const userRole = getUserRole(user);
              const userBranches = getUserBranches(user);
              const fullName = getFullName(user.profile);

              return (
                <TableRow
                  key={user.id}
                  className={isInactive ? 'opacity-60' : ''}
                >
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profile.avatar || undefined} />
                        <AvatarFallback className="text-xs">
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {fullName}
                          {isInactive && (
                            <Lock className="ml-2 inline h-4 w-4 text-gray-400" />
                          )}
                        </span>
                        {user.is_first_login && (
                          <span className="text-xs text-orange-600">
                            First login pending
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={isInactive ? 'text-gray-400' : ''}>
                      {user.profile.email}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        isInactive ? 'text-gray-400 border-gray-300' : ''
                      }
                    >
                      {ROLE_DISPLAY_NAMES[userRole]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[150px] truncate">
                      <span
                        className={`text-sm ${
                          isInactive ? 'text-gray-400' : 'text-muted-foreground'
                        }`}
                      >
                        {userBranches}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.is_active ? 'default' : 'secondary'}
                      className={
                        isInactive ? 'bg-muted text-muted-foreground' : ''
                      }
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-sm ${
                        isInactive ? 'text-gray-400' : 'text-muted-foreground'
                      }`}
                    >
                      {user.last_login
                        ? format(new Date(user.last_login), 'MMM d, yyyy')
                        : 'Never'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleAction('edit', user)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleAction('regenerate-password', user)
                            }
                          >
                            <Key className="mr-2 h-4 w-4" />
                            Regenerate Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.is_active ? (
                            <DropdownMenuItem
                              onClick={() => handleAction('deactivate', user)}
                              className="text-orange-600"
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleAction('reactivate', user)}
                              className="text-green-600"
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Reactivate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleAction('delete', user)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Permanently
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            className="h-8 w-8 p-0 cursor-not-allowed"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Only owners and admins can manage users</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
