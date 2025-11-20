import { useMemo } from 'react';
import type { AttendanceSession } from '@/types/attendance';
import {
  validateSessionForMarking,
  formatValidationMessage,
} from '@/utils/attendance/sessionValidation';
import type { ValidationContext, ValidationResult } from '@/utils/attendance/sessionValidation';

export interface UseSessionValidationResult extends ValidationResult {
  message: string | null;
}

export function useSessionValidation(
  session: AttendanceSession | undefined,
  context: ValidationContext
): UseSessionValidationResult {
  return useMemo(() => {
    if (!session) {
      const empty: UseSessionValidationResult = {
        ok: false,
        checks: {
          isOpen: false,
          withinTimeWindow: false,
          publicAllowed: false,
          modeEnabled: false,
          memberAllowed: 'unknown',
          proximityOk: 'skipped',
          memberInSessionBranch: 'unknown',
        },
        reasons: ['missing_session'],
        message: 'No session provided.',
      };
      return empty;
    }

    const result = validateSessionForMarking(session, context);
    const message = formatValidationMessage(result);
    return { ...result, message };
  }, [session, context]);
}