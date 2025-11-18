import { useOrganization } from '@/contexts/OrganizationContext';
import type { SectionKey, FinanceChildKey, VisibilityOverrides } from '@/types/access-control';
import type { UserRole } from '@/lib/auth';

function defaultSectionAccess(role: UserRole, section: SectionKey): boolean {
  if (role === 'owner') return true;
  if (role === 'admin') return section !== 'finance';
  if (role === 'branch_admin') return section !== 'finance';
  if (role === 'finance_admin') return section === 'finance';
  if (role === 'attendance_manager' || role === 'attendance_rep') return false;
  if (role === 'write' || role === 'read') return false;
  return false;
}

function getOverrides(overrides?: VisibilityOverrides) {
  return overrides?.sections || {};
}

export function useAccess() {
  const { currentOrganization } = useOrganization();
  const role = currentOrganization?.user_role as UserRole | undefined;
  const overrides = getOverrides(currentOrganization?.user_permissions?.visibility_overrides);

  const canAccess = (section: SectionKey): boolean => {
    if (!role) return false;

    // Overrides are authoritative when present
    if (section === 'people') {
      const p = overrides.people as any;
      if (p && typeof p.enabled !== 'undefined') return !!p.enabled;
    } else if (section === 'finance') {
      const f = overrides.finance as any;
      if (f && typeof f.enabled !== 'undefined') return !!f.enabled;
    } else {
      const v = (overrides as any)[section];
      if (typeof v !== 'undefined') return !!v;
    }

    // Fall back to role defaults
    const base = defaultSectionAccess(role, section);
    if (base) return true;

    // If base denies and no override, still allow explicit enables
    if (section === 'people') {
      const p = overrides.people as any;
      return !!(p?.enabled);
    }
    if (section === 'finance') {
      const f = overrides.finance as any;
      return !!(f?.enabled);
    }
    if (section === 'branches') return !!overrides.branches;
    if (section === 'events') return !!overrides.events;
    if (section === 'announcements') return !!overrides.announcements;
    if (section === 'assets') return !!overrides.assets;
    if (section === 'user_management') return !!overrides.user_management;
    if (section === 'settings') return !!overrides.settings;
    return false;
  };

  const canAccessFinanceChild = (child: FinanceChildKey): boolean => {
    if (!role) return false;
    if (!canAccess('finance')) return false;
    if (role === 'owner' || role === 'finance_admin') return true;
    const f = overrides.finance;
    if (!f) return false;
    if (f.enabled) return true;
    return !!(f as any)[child];
  };

  const defaultPeopleChildAccess = (child: 'attendance' | 'tags_groups' | 'membership' | 'form_builder'): boolean => {
    if (!role) return false;
    if (role === 'owner') return true;
    if (role === 'admin' || role === 'branch_admin') return true;
    if (role === 'finance_admin') return false;
    if (role === 'attendance_manager') return child === 'attendance';
    if (role === 'attendance_rep') return child === 'attendance';
    return false;
  };

  const canAccessPeopleChild = (child: 'attendance' | 'tags_groups' | 'membership' | 'form_builder'): boolean => {
    if (!role) return false;
    const p = overrides.people as any;
    if (canAccess('people')) return true;
    if (p && typeof p.enabled !== 'undefined') {
      if (p.enabled === true) return true;
      // When explicitly disabled, only allow if child explicitly enabled
      return !!p[child];
    }
    if (p && typeof p[child] !== 'undefined') return !!p[child];
    return defaultPeopleChildAccess(child);
  };

  const hasAnyOverrides = (): boolean => {
    if (!role) return false;
    const check = (section: SectionKey): boolean => {
      const base = defaultSectionAccess(role, section);
      if (section === 'people') {
        const p = overrides.people as any;
        if (p && typeof p.enabled !== 'undefined') return !!p.enabled !== base;
        return false;
      }
      if (section === 'finance') {
        const f = overrides.finance as any;
        if (f && typeof f.enabled !== 'undefined') return !!f.enabled !== base;
        return false;
      }
      const v = (overrides as any)[section];
      if (typeof v !== 'undefined') return !!v !== base;
      return false;
    };
    return (
      check('branches') ||
      check('people') ||
      check('finance') ||
      check('events') ||
      check('announcements') ||
      check('assets') ||
      check('user_management') ||
      check('settings')
    );
  };

  const canCreateUsers = (): boolean => {
    const cap = currentOrganization?.user_permissions?.capabilities;
    if (role === 'owner') return true;
    if (role === 'admin') return !!cap?.can_create_users;
    if (role === 'branch_admin') return true;
    return false;
  };

  return { canAccess, canAccessFinanceChild, canAccessPeopleChild, canCreateUsers, hasAnyOverrides, role };
}