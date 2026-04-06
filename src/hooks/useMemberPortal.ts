import { useMutation, useQuery } from '@tanstack/react-query';
import { memberPortalService } from '@/services/member-portal.service';

export const memberPortalKeys = {
  all: ['member-portal'] as const,
  validateToken: (token: string) => [...memberPortalKeys.all, 'validate', token] as const,
  profile: (memberId: string) => [...memberPortalKeys.all, 'profile', memberId] as const,
};

export const useValidateMemberToken = (token: string) => {
  return useQuery({
    queryKey: memberPortalKeys.validateToken(token),
    queryFn: () => memberPortalService.validateToken(token),
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
};

export const useVerifyPhoneAndSendOtp = () => {
  return useMutation({
    mutationFn: ({ token, phone, organizationName, smsSenderId }: { token: string; phone: string; organizationName: string, smsSenderId?: string }) =>
      memberPortalService.verifyPhoneAndSendOtp(token, phone, organizationName, smsSenderId),
  });
};

export const useVerifyMemberOtp = () => {
  return useMutation({
    mutationFn: ({ otpId, otpCode }: { otpId: string; otpCode: string }) =>
      memberPortalService.verifyOtp(otpId, otpCode),
  });
};

export const useSetupMemberPin = () => {
  return useMutation({
    mutationFn: ({ token, pin }: { token: string; pin: string }) =>
      memberPortalService.setupPin(token, pin),
  });
};

export const useMemberPinLogin = () => {
  return useMutation({
    mutationFn: ({ phone, pin }: { phone: string; pin: string }) =>
      memberPortalService.loginWithPin(phone, pin),
  });
};

export const useGenerateMemberAccessLink = () => {
  return useMutation({
    mutationFn: ({ memberId, organizationId, purpose }: { memberId: string; organizationId: string; purpose: 'PIN_SETUP' | 'PIN_RESET' | 'VIEW_PROFILE' }) =>
      memberPortalService.generateAccessLink(memberId, organizationId, purpose),
  });
};
