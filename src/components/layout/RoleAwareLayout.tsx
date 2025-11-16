import { useRoleCheck } from '@/components/auth/RoleGuard';
import { MainLayout } from './MainLayout';
import { AttendanceManagerLayout } from './role-layouts/AttendanceManagerLayout';
import { AttendanceRepLayout } from './role-layouts/AttendanceRepLayout';
import { FinanceAdminLayout } from './role-layouts/FinanceAdminLayout';

export function RoleAwareLayout() {
  const { isAttendanceManager, isAttendanceRep, isFinanceAdmin } = useRoleCheck();

  if (isAttendanceManager()) {
    return <AttendanceManagerLayout />;
  }

  if (isAttendanceRep()) {
    return <AttendanceRepLayout />;
  }

  if (isFinanceAdmin()) {
    return <FinanceAdminLayout />;
  }

  return <MainLayout />;
}