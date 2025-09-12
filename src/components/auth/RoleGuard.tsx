import { useOrganization } from '@/contexts/OrganizationContext';
import type { OrganizationRole } from '@/types/organizations';
import type { ReactNode } from 'react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: OrganizationRole[];
  fallback?: ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const { currentOrganization } = useOrganization();

  if (!currentOrganization) {
    return <>{fallback}</>;
  }

  const hasPermission = allowedRoles.includes(currentOrganization.user_role);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Hook for checking roles in components
export function useRoleCheck() {
  const { currentOrganization } = useOrganization();

  const hasRole = (roles: OrganizationRole[]) => {
    if (!currentOrganization) return false;
    return roles.includes(currentOrganization.user_role);
  };

  const canManageAllData = () => hasRole(['owner', 'admin']);
  const canWrite = () => hasRole(['owner', 'admin', 'write']);
  const canRead = () => hasRole(['owner', 'admin', 'write', 'read']);
  const isOwner = () => hasRole(['owner']);
  const isAdmin = () => hasRole(['admin']);

  return {
    hasRole,
    canManageAllData,
    canWrite,
    canRead,
    isOwner,
    isAdmin,
    currentRole: currentOrganization?.user_role,
  };
}

// Higher-order component for role-based access
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: OrganizationRole[],
  fallback?: ReactNode
) {
  return function GuardedComponent(props: P) {
    return (
      <RoleGuard allowedRoles={allowedRoles} fallback={fallback}>
        <Component {...props} />
      </RoleGuard>
    );
  };
}