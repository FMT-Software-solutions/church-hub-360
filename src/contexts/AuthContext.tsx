import React, { createContext, useCallback, useContext } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthUserWithProfile } from '../types/user-management';
import { supabase } from '../utils/supabase';
import type { Session } from '@supabase/supabase-js';
import {
  useSession,
  useUserProfile,
  useSignIn,
  useSignOut,
  useUpdatePassword,
  useRequestOtp,
  useVerifyOtp,
  useResetOtpRequestCount,
  authKeys,
} from '../hooks/useAuthQueries';

interface OtpRequest {
  success: boolean;
  message: string;
  cooldownMinutes?: number;
  remainingRequests?: number;
}

interface OtpVerification {
  success: boolean;
  message: string;
  session?: any;
  user?: any;
}

interface PasswordResetRequest {
  newPassword: string;
  type: 'password_reset' | 'first_time_login';
}

interface PasswordResetResponse {
  success: boolean;
  message: string;
}

interface SignInResult {
  error: any;
  isFirstTimeLogin?: boolean;
  requiresPasswordReset?: boolean;
  isInActiveUser?: boolean;
}

interface AuthContextType {
  user: AuthUserWithProfile | null;
  session: Session | null | undefined;
  setSession: (session: Session | null) => void;
  initializeUser: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  updatePassword: (
    request: PasswordResetRequest
  ) => Promise<PasswordResetResponse>;
  requestOtp: (email: string) => Promise<OtpRequest>;
  verifyOtp: (
    email: string,
    otp: string,
    isPasswordReset?: boolean
  ) => Promise<OtpVerification>;
  checkFirstTimeLogin: (userId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { data: authUserWithProfile } = useUserProfile(session?.user?.id);

  // Initialize mutation hooks
  const signInMutation = useSignIn();
  const signOutMutation = useSignOut();
  const updatePasswordMutation = useUpdatePassword();
  const requestOtpMutation = useRequestOtp();
  const verifyOtpMutation = useVerifyOtp();
  const resetOtpRequestCountMutation = useResetOtpRequestCount();

  // Custom setSession function that updates React Query cache
  const setSession = useCallback(
    (newSession: Session | null) => {
      queryClient.setQueryData(authKeys.session(), newSession);
    },
    [queryClient]
  );

  const initializeUser = useCallback(async () => {
    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession?.user) {
        // Clear all auth-related queries when no session
        queryClient.removeQueries({ queryKey: authKeys.all });
        return;
      }

      // Update session in React Query cache
      setSession(currentSession);

      // Check if user is active by invalidating and refetching user profile
      queryClient.invalidateQueries({
        queryKey: authKeys.userProfile(currentSession.user.id),
      });

      // Get the fresh user profile data
      const { data: authUserProfile, error } = await supabase
        .from('auth_users')
        .select(
          `
          *,
          profile:profiles!auth_users_id_fkey1(*)
        `
        )
        .eq('id', currentSession.user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        // Clear all auth-related queries on error
        queryClient.removeQueries({ queryKey: authKeys.all });
        await signOut();
      } else {
        if (authUserProfile && authUserProfile.is_active === false) {
          await supabase.auth.signOut();
          queryClient.removeQueries({ queryKey: authKeys.all });
          return;
        }
        // Update the user profile in React Query cache
        queryClient.setQueryData(
          authKeys.userProfile(currentSession.user.id),
          authUserProfile
        );
      }
    } catch (error) {
      console.error('Error initializing user:', error);
      queryClient.removeQueries({ queryKey: authKeys.all });
    }
  }, [queryClient, setSession]);

  const signIn = async (
    email: string,
    password: string
  ): Promise<SignInResult> => {
    try {
      const data = await signInMutation.mutateAsync({ email, password });

      // Check if user is active
      const userStatus = await isUserActive(data.user.id);
      if (!userStatus.userExists || !userStatus.isActive) {
        await signOut();
        return {
          error: null,
          isInActiveUser: true,
        };
      }

      if (data.user) {
        // set session state
        setSession(data.session);

        const isFirstTime = await checkFirstTimeLogin(data.user.id);

        // Check if this is a first-time login
        if (isFirstTime) {
          return {
            error: null,
            isFirstTimeLogin: true,
            requiresPasswordReset: true,
          };
        }

        // Reset OTP request count on successful login
        await resetOtpRequestCountMutation.mutateAsync(data.user.id);
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    await signOutMutation.mutateAsync();
  };

  const updatePassword = async (
    request: PasswordResetRequest
  ): Promise<PasswordResetResponse> => {
    try {
      const data = await updatePasswordMutation.mutateAsync({
        newPassword: request.newPassword,
        type: request.type,
      });

      //set session state
      const {
        data: { session: newSession },
      } = await supabase.auth.getSession();
      setSession(newSession);

      // Reset OTP request count on successful login
      await resetOtpRequestCountMutation.mutateAsync(data.user.id);

      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      return {
        success: false,
        message: (error as any).message || 'Failed to reset password',
      };
    }
  };

  const requestOtp = async (email: string): Promise<OtpRequest> => {
    try {
      // Check if user exists and is active
      const userStatus = await isUserActive(undefined, email);
      if (!userStatus.userExists) {
        return {
          success: false,
          message:
            'No account found with this email address. Please check your email or contact your administrator.',
        };
      }
      if (!userStatus.isActive) {
        await signOut();
        return {
          success: false,
          message:
            'Your account is inactive. Please contact your administrator.',
        };
      }
      if (userStatus.error) {
        return {
          success: false,
          message: 'Unable to verify account status. Please try again later.',
        };
      }

      const result = await requestOtpMutation.mutateAsync(email);

      return {
        success: true,
        message: result.message || 'Verification email sent successfully',
        remainingRequests: result.remainingRequests,
      };
    } catch (error) {
      return {
        success: false,
        message: (error as any).message || 'Network error occurred',
        cooldownMinutes: (error as any).cooldownMinutes,
        remainingRequests: (error as any).remainingRequests,
      };
    }
  };

  const verifyOtp = async (
    email: string,
    otp: string
  ): Promise<OtpVerification> => {
    try {
      const result = await verifyOtpMutation.mutateAsync({ email, otp });

      // If OTP verification is successful, use the session from backend
      if (!result.session) {
        return {
          success: false,
          message: 'No session found from server',
        };
      }

      // Set the session from the backend response
      await supabase.auth.setSession(result.session);
      setSession(result.session);

      // initialize user
      await initializeUser();

      return {
        success: true,
        message: result.message || 'Code verified successfully',
        session: result.session,
      };
    } catch (error) {
      return {
        success: false,
        message: (error as any).message || 'Error verifying OTP Code',
      };
    }
  };

  const checkFirstTimeLogin = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('is_first_login')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking first-time login:', error);
        return false;
      }

      return data?.is_first_login ?? false;
    } catch (error) {
      console.error('Error checking first-time login:', error);
      return false;
    }
  };

  const isUserActive = async (
    userId?: string,
    userEmail?: string
  ): Promise<{ isActive: boolean; userExists: boolean; error?: string }> => {
    try {
      let query = supabase.from('auth_users').select('is_active');

      if (userId) {
        query = query.eq('id', userId);
      } else if (userEmail) {
        query = query.eq('email', userEmail);
      } else {
        // If neither userId nor userEmail is provided
        return {
          isActive: false,
          userExists: false,
          error: 'No user identifier provided',
        };
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Error checking user activity:', error);
        return {
          isActive: false,
          userExists: false,
          error: 'Database error occurred',
        };
      }

      // If no user found
      if (!data) {
        console.error('User not found in auth_users table');
        return { isActive: false, userExists: false };
      }

      return { isActive: data.is_active ?? false, userExists: true };
    } catch (error) {
      console.error('Error checking user activity:', error);
      return {
        isActive: false,
        userExists: false,
        error: 'Unexpected error occurred',
      };
    }
  };

  const value = {
    user: authUserWithProfile ?? null,
    session,
    initializeUser,
    signIn,
    signOut,
    updatePassword,
    requestOtp,
    verifyOtp,
    checkFirstTimeLogin,
    setSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
