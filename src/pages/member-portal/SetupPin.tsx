import React, { useState } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSetupMemberPin } from '@/hooks/useMemberPortal';
import { toast } from 'sonner';
import { Loader2, Lock } from 'lucide-react';

export default function SetupPin() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');

    const token = searchParams.get('token');
    const setupPinMutation = useSetupMemberPin();

    if (!token) {
        return <Navigate to="/m/verify" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pin.length < 4) {
            toast.error('PIN must be at least 4 digits');
            return;
        }
        if (pin !== confirmPin) {
            toast.error('PINs do not match');
            return;
        }

        try {
            const result = await setupPinMutation.mutateAsync({
                token,
                pin,
            });

            if (result.success) {
                toast.success('PIN Setup Successful', { description: 'You can now access your profile.' });
                navigate(`/m/login`);
            } else {
                toast.error('Setup failed', { description: result.error || 'Could not setup PIN.' });
            }
        } catch (err: any) {
            toast.error('Setup failed', { description: err.message || 'An error occurred. Please try again.' });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                        <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-center text-xl">Create Your PIN</CardTitle>
                    <CardDescription className="text-center">
                        Set a secure PIN. Do not share this pin with anyone.
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-2">
                        <div className="space-y-2">
                            <label htmlFor="pin" className="text-sm font-medium">
                                Enter PIN (4-6 digits)
                            </label>
                            <Input
                                id="pin"
                                type="password"
                                placeholder="****"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                disabled={setupPinMutation.isPending}
                                className="text-center text-2xl tracking-widest"
                                maxLength={6}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="confirmPin" className="text-sm font-medium">
                                Confirm PIN
                            </label>
                            <Input
                                id="confirmPin"
                                type="password"
                                placeholder="****"
                                value={confirmPin}
                                onChange={(e) => setConfirmPin(e.target.value)}
                                disabled={setupPinMutation.isPending}
                                className="text-center text-2xl tracking-widest"
                                maxLength={6}
                                required
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="py-4">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={setupPinMutation.isPending || pin.length < 4 || !confirmPin}
                        >
                            {setupPinMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save PIN'
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
