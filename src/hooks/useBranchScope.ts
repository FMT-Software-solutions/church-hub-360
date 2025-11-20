import { useAuth } from '@/contexts/AuthContext';
import { useRoleCheck } from '@/registry/access/RoleGuard';
import { useUserBranches } from '@/hooks/useBranchQueries';

export interface BranchScope {
  isScoped: boolean;
  branchIds: string[];
}

export function useBranchScope(organizationId?: string): BranchScope {
  const { canManageAllData } = useRoleCheck();
  const { user } = useAuth();
  const { data: userBranches = [] } = useUserBranches(user?.id, organizationId);
  const branchIds = (userBranches || [])
    .map((ub: any) => ub.branch_id)
    .filter((id: any) => !!id) as string[];
  return {
    isScoped: !canManageAllData(),
    branchIds,
  };
}

export function applyBranchScope(
  query: any,
  scope: BranchScope,
  column: string = 'branch_id',
  includeNullGlobal: boolean = false
): { query: any; abortIfEmpty: boolean } {
  if (!scope.isScoped) return { query, abortIfEmpty: false };
  if (scope.branchIds.length === 0) {
    if (includeNullGlobal) {
      return { query: query.is(column, null), abortIfEmpty: false };
    }
    return { query, abortIfEmpty: true };
  }
  if (includeNullGlobal) {
    return {
      query: query.or(`${column}.is.null,${column}.in.(${scope.branchIds.join(',')})`),
      abortIfEmpty: false,
    };
  }
  return { query: query.in(column, scope.branchIds), abortIfEmpty: false };
}