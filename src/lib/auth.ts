// Authentication and authorization utilities

// User roles within organizations
export type UserRole =
  | 'owner'
  | 'admin'
  | 'branch_admin'
  | 'write'
  | 'read'
  | 'finance_admin'
  | 'attendance_manager'
  | 'attendance_rep';

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 5,
  admin: 4,
  branch_admin: 3,
  write: 2,
  read: 1,
  finance_admin: 1,
  attendance_manager: 1,
  attendance_rep: 1,
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
  finance_admin: 'Finance Admin',
  attendance_manager: 'Attendance Manager',
  attendance_rep: 'Attendance Representative',
};

// Role descriptions
export const USER_ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  owner: 'Full access to all organization settings and data',
  admin: 'Manage users and organization settings across all branches',
  branch_admin: 'Manage users and settings within assigned branches',
  write: 'Create and edit content',
  read: 'View-only access',
  finance_admin: 'Access finance features within assigned branches',
  attendance_manager: 'Create and manage attendance within assigned branches',
  attendance_rep: 'View and mark attendance within assigned branches',
};