import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMemberPinLogin } from '@/hooks/useMemberPortal';
import { toast } from 'sonner';
import { Loader2, LogIn } from 'lucide-react';

export default function MemberLogin() {
    const navigate = useNavigate();
    const [phone, setPhone] = useState('');
    const [pin, setPin] = useState('');

    const loginMutation = useMemberPinLogin();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone || pin.length < 4) {
            toast.error('Please enter a valid phone number and PIN');
            return;
        }

        try {
            const result = await loginMutation.mutateAsync({
                phone,
                pin,
            });

            if (result.success && result.member) {
                toast.success('Logged in successfully');
                // In a real app, we would save the session token here.
                // For now, since we only have the member object, we can pass it via state to the profile page.
                // Using session storage is better so it persists across reloads for the session.
                sessionStorage.setItem('memberPortalSession', JSON.stringify((result.member as any).json_build_object || result.member));
                navigate(`/m/profile`);
            } else {
                toast.error('Login failed', { description: result.error || 'Invalid credentials.' });
            }
        } catch (err: any) {
            toast.error('Login failed', { description: err.message || 'An error occurred. Please try again.' });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                        <LogIn className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-center text-xl">Member Portal</CardTitle>
                    <CardDescription className="text-center">
                        Login with your phone number and PIN to view your profile.
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-2">
                        <div className="space-y-2">
                            <label htmlFor="phone" className="text-sm font-medium">
                                Phone Number
                            </label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="e.g. 0241234567"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                disabled={loginMutation.isPending}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="pin" className="text-sm font-medium">
                                PIN
                            </label>
                            <Input
                                id="pin"
                                type="password"
                                placeholder="****"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                disabled={loginMutation.isPending}
                                className="text-center text-2xl tracking-widest"
                                maxLength={6}
                                required
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 py-4">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loginMutation.isPending || !phone || pin.length < 4}
                        >
                            {loginMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                'Login'
                            )}
                        </Button>

                        <p className="text-sm text-center text-muted-foreground">
                            Forgot your PIN? Please contact your church admin.
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
