import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSmsBalance } from '@/components/shared/sms-credits/hooks/useSmsBalance';
import { sendSmsMessage } from '@/services/sms.service';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateCommunicationHistory } from '@/hooks/useCommunicationHistory';
import { Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QuickSmsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    recipientName: string;
    recipientPhone: string;
    memberId?: string;
    defaultMessage: string;
}

export function QuickSmsDialog({
    isOpen,
    onOpenChange,
    recipientName,
    recipientPhone,
    memberId,
    defaultMessage,
}: QuickSmsDialogProps) {
    const [message, setMessage] = useState(defaultMessage);
    const [isSending, setIsSending] = useState(false);
    const { currentOrganization } = useOrganization();
    const { data: balanceData, isLoading: isLoadingBalance } = useSmsBalance(currentOrganization?.id);
    const queryClient = useQueryClient();
    const createHistoryMutation = useCreateCommunicationHistory();

    // Basic calculation: 1 credit per 160 characters (GSM-7 assumed)
    const requiredCredits = Math.ceil((message.length || 1) / 160);
    const hasEnoughCredits = (balanceData?.credit_balance || 0) >= requiredCredits;

    const handleSend = async () => {
        if (!message.trim()) {
            toast.error('Message cannot be empty');
            return;
        }

        if (!recipientPhone) {
            toast.error('Recipient phone number is missing');
            return;
        }

        if (!hasEnoughCredits) {
            toast.error('Insufficient SMS credits');
            return;
        }

        setIsSending(true);
        try {
            const senderId = currentOrganization?.sms_sender_id || import.meta.env.VITE_DEFAULT_SMS_SENDER_ID || 'ChurchHub';
            const isSandbox = false; // Set to false in production

            await sendSmsMessage({
                sender: senderId,
                message,
                recipients: [{ phone: recipientPhone }],
                sandbox: isSandbox,
                organizationId: currentOrganization?.id
            });

            // Log to history
            if (createHistoryMutation) {
                await createHistoryMutation.mutateAsync({
                    type: 'sms',
                    content: message,
                    recipient_type: 'custom',
                    recipient_ids: memberId ? [memberId] : [],
                    recipient_count: 1,
                    status: 'sent',
                });
            }

            // Immediately invalidate balance
            queryClient.invalidateQueries({ queryKey: ['sms_balance', currentOrganization?.id] });

            toast.success('SMS sent successfully');
            onOpenChange(false);
        } catch (error: any) {
            console.error('Failed to send SMS:', error);
            toast.error(error.message || 'Failed to send SMS');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Send SMS to {recipientName}
                    </DialogTitle>
                    <DialogDescription className='text-xs'>
                        You can customize your message before sending.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-muted-foreground">To: {recipientPhone}</span>
                        <span className="text-muted-foreground">
                            {message.length} chars ({requiredCredits} credit{requiredCredits !== 1 ? 's' : ''})
                        </span>
                    </div>

                    <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={5}
                        className="resize-none"
                        placeholder="Type your message here..."
                    />

                    {!isLoadingBalance && !hasEnoughCredits && (
                        <Alert variant="destructive" className="py-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                                You need {requiredCredits} sms credits but only have {balanceData?.credit_balance || 0}. Please top up your balance.
                            </AlertDescription>
                        </Alert>
                    )}

                    {!isLoadingBalance && hasEnoughCredits && (
                        <p className="text-xs text-muted-foreground text-right">
                            Balance: <strong className="text-foreground">{balanceData?.credit_balance} credits</strong>
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
                        Cancel
                    </Button>
                    <Button onClick={handleSend} disabled={isSending || !hasEnoughCredits || !message.trim()}>
                        {isSending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            'Send SMS'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
