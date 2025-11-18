import { useRoleCheck } from '@/components/auth/RoleGuard';
import { MainLayout } from './MainLayout';
import { AttendanceManagerLayout } from './role-layouts/AttendanceManagerLayout';
import { AttendanceRepLayout } from './role-layouts/AttendanceRepLayout';
import { FinanceAdminLayout } from './role-layouts/FinanceAdminLayout';
import { useAccess } from '@/lib/access-control';

export function RoleAwareLayout() {
  const { isAttendanceManager, isAttendanceRep, isFinanceAdmin } = useRoleCheck();
  const { hasAnyOverrides } = useAccess();

  if (!hasAnyOverrides() && isAttendanceManager()) {
    return <AttendanceManagerLayout />;
  }

  if (!hasAnyOverrides() && isAttendanceRep()) {
    return <AttendanceRepLayout />;
  }

  if (!hasAnyOverrides() && isFinanceAdmin()) {
    return <FinanceAdminLayout />;
  }

  return <MainLayout />;
}