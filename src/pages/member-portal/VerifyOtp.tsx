import React, { useState } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVerifyMemberOtp } from '@/hooks/useMemberPortal';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function VerifyOtp() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [otp, setOtp] = useState('');

    const token = searchParams.get('token');
    const otpId = searchParams.get('otpId');
    const purpose = searchParams.get('purpose');

    const verifyOtpMutation = useVerifyMemberOtp();

    if (!token || !otpId || !purpose) {
        return <Navigate to="/m/verify" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp.trim() || otp.length < 4) {
            toast.error('Please enter a valid OTP code');
            return;
        }

        try {
            const result = await verifyOtpMutation.mutateAsync({
                otpId,
                otpCode: otp,
            });

            if (result.success) {
                toast.success('OTP Verified Successfully');

                // Route based on purpose
                if (purpose === 'PIN_SETUP' || purpose === 'PIN_RESET') {
                    navigate(`/m/setup-pin?token=${token}`);
                } else if (purpose === 'VIEW_PROFILE') {
                    // If just viewing profile, they need to login. We will generate a temp token or rely on token.
                    // For now we'll route to login, but ideally the backend issues a session.
                    // Since we don't have a full session architecture here, let's redirect to login and they can use their existing PIN.
                    navigate(`/m/login`);
                }
            } else {
                toast.error('Verification failed', { description: result.error || 'Invalid OTP code.' });
            }
        } catch (err: any) {
            toast.error('Verification failed', { description: err.message || 'An error occurred. Please try again.' });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardDescription className="text-center">
                        We've sent a verification code to your phone number.
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-x-2 flex">
                        <Input
                            id="otp"
                            type="text"
                            placeholder="Enter 6-digit code"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            disabled={verifyOtpMutation.isPending}
                            className="text-center text-2xl tracking-widest w-full"
                            maxLength={6}
                            required
                        />


                        <Button
                            type="submit"
                            className="w-25"
                            disabled={verifyOtpMutation.isPending || otp.length < 4}
                        >
                            {verifyOtpMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify Code'
                            )}
                        </Button>
                    </CardContent>


                </form>
            </Card>
        </div>
    );
}
