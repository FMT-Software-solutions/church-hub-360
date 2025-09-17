// Authentication and authorization utilities

// User roles within organizations
export type UserRole = 'owner' | 'admin' | 'branch_admin' | 'write' | 'read';

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 5,
  admin: 4,
  branch_admin: 3,
  write: 2,
  read: 1,
};

// Helper function to check if user has permission
export const hasUserPermission = (
  userRole: UserRole,
  requiredRole: UserRole
): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

// Role display names
export const USER_ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  owner: 'Owner',
  admin: 'Administrator',
  branch_admin: 'Branch Administrator',
  write: 'Editor',
  read: 'Viewer',
};

// Role descriptions
export const USER_ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  owner: 'Full access to all organization settings and data',
  admin: 'Manage users and organization settings across all branches',
  branch_admin: 'Manage users and settings within assigned branches',
  write: 'Create and edit content',
  read: 'View-only access',
};