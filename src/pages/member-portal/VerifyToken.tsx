import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useValidateMemberToken, useVerifyPhoneAndSendOtp } from '@/hooks/useMemberPortal';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';

export default function VerifyToken() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [phone, setPhone] = useState('');

    let token = searchParams.get('token');
    if (!token) {
        const search = window.location.search;
        const urlParams = new URLSearchParams(search);
        token = urlParams.get('token');
    }

    const { data: validationData, isLoading: isValidating, error: validationError } = useValidateMemberToken(token || '');
    const verifyPhoneMutation = useVerifyPhoneAndSendOtp();

    useEffect(() => {
        if (!token) {
            toast.error('Invalid link', { description: 'No verification token found in the URL.' });
        }
    }, [token]);

    // Automatically redirect to login if the purpose is just to view the profile
    useEffect(() => {
        if (validationData && validationData.valid && validationData.purpose === 'VIEW_PROFILE') {
            navigate('/m/login', { replace: true });
        }
    }, [validationData, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        if (!phone.trim()) {
            toast.error('Please enter your phone number');
            return;
        }

        try {
            const result = await verifyPhoneMutation.mutateAsync({
                token,
                phone,
                organizationName: 'Church', // In a real app we could fetch this, but for now generic
                smsSenderId: import.meta.env.VITE_DEFAULT_SMS_SENDER_ID, // Since we don't have the org loaded here, rely on default or let backend handle it
            });

            if (result.success && result.otpId) {
                toast.success('Verification code sent!', { description: 'Please check your SMS.' });
                // Navigate to OTP step, passing the token, otpId, and purpose
                navigate(`/m/otp?token=${token}&otpId=${result.otpId}&purpose=${validationData?.purpose}`);
            } else {
                toast.error('Verification failed', { description: result.error || 'The phone number you entered does not match our records.' });
            }
        } catch (err: any) {
            toast.error('Verification failed', { description: err.message || 'An error occurred. Please try again.' });
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Invalid Link
                        </CardTitle>
                        <CardDescription>
                            This link is missing a security token. Please request a new link.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (isValidating) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
                <Card className="w-full max-w-md text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
                    <p className="text-muted-foreground">Validating your secure link...</p>
                </Card>
            </div>
        );
    }

    if (validationError || (validationData && !validationData.valid)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Link Expired or Invalid
                        </CardTitle>
                        <CardDescription>
                            {validationData?.error || 'This security link has expired or is no longer valid.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            For your security, access links are only valid for a limited time and can only be used once.
                            Please contact your church admin to request a new link.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Verify Your Identity</CardTitle>
                </CardHeader>

                <div className='text-sm px-6'>
                    Enter your phone number which ends in <strong className="font-bold">{validationData?.maskedPhone}</strong>
                    <p className="text-xs text-muted-foreground">
                        We will send a verification code to this number via SMS.
                    </p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="space-x-2 flex px-6">
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="e.g. 0241234567"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            disabled={verifyPhoneMutation.isPending}
                            required
                        />

                        <Button
                            type="submit"
                            className="w-36"
                            disabled={verifyPhoneMutation.isPending || !phone.trim()}
                        >
                            {verifyPhoneMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending Code...
                                </>
                            ) : (
                                'Send Code'
                            )}
                        </Button>

                    </div>
                </form>
            </Card>
        </div>
    );
}
