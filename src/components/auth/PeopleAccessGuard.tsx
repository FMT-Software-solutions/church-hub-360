import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAccess } from '@/lib/access-control';

interface PeopleAccessGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

function toChildKey(segment?: string) {
  switch (segment) {
    case 'attendance':
      return 'attendance' as const;
    case 'membership':
      return 'membership' as const;
    case 'form-builder':
      return 'form_builder' as const;
    case 'tags':
    case 'groups':
      return 'tags_groups' as const;
    default:
      return null;
  }
}

export function PeopleAccessGuard({ children, fallback = null }: PeopleAccessGuardProps) {
  const { canAccess, canAccessPeopleChild } = useAccess();
  const location = useLocation();
  const path = location.pathname;
  const segment = path.startsWith('/people/') ? path.split('/')[2] : undefined;
  const childKey = toChildKey(segment || undefined);

  const allow = canAccess('people') || (!!childKey && canAccessPeopleChild(childKey));
  if (!allow) return <>{fallback}</>;
  return <>{children}</>;
}