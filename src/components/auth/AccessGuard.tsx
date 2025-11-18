import type { ReactNode } from 'react';
import type { SectionKey } from '@/types/access-control';
import { useAccess } from '@/lib/access-control';

interface AccessGuardProps {
  section: SectionKey;
  children: ReactNode;
  fallback?: ReactNode;
}

export function AccessGuard({ section, children, fallback = null }: AccessGuardProps) {
  const { canAccess } = useAccess();
  if (!canAccess(section)) return <>{fallback}</>;
  return <>{children}</>;
}