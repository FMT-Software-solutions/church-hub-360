import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useGenerateMemberAccessLink } from '@/hooks/useMemberPortal';
import { useOrganization } from '@/contexts/OrganizationContext';
import { CopyToClipboard } from '@/components/shared/CopyToClipboard';
import { Loader2, Link as LinkIcon, Send } from 'lucide-react';
import { QuickSmsDialog } from '@/components/shared/sms/QuickSmsDialog';
import type { MemberSummary } from '@/types/members';

interface MemberAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: MemberSummary | null;
}

export function MemberAccessModal({ isOpen, onClose, member }: MemberAccessModalProps) {
  const { currentOrganization } = useOrganization();
  const [purpose, setPurpose] = useState<'PIN_SETUP' | 'PIN_RESET' | 'VIEW_PROFILE'>('PIN_SETUP');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [showSmsDialog, setShowSmsDialog] = useState(false);

  const generateLinkMutation = useGenerateMemberAccessLink();

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen && member) {
      setGeneratedLink(null);
      // If member already has a PIN setup date, default to PIN_RESET instead of PIN_SETUP
      setPurpose(member.pin_setup_at ? 'PIN_RESET' : 'PIN_SETUP');
    }
  }, [isOpen, member]);

  if (!member || !currentOrganization) return null;

  const handleGenerate = async () => {
    try {
      const link = await generateLinkMutation.mutateAsync({
        memberId: member.id,
        organizationId: currentOrganization.id,
        purpose,
      });
      setGeneratedLink(link);
    } catch (err) {
      console.error(err);
    }
  };

  const getPurposeLabel = (p: string) => {
    switch (p) {
      case 'PIN_SETUP': return 'PIN Setup';
      case 'PIN_RESET': return 'PIN Reset';
      case 'VIEW_PROFILE': return 'View Profile';
      default: return p;
    }
  };

  const getSmsMessage = () => {
    const label = getPurposeLabel(purpose);
    return `Hello ${member.first_name}, here is your ${label} link for the ${currentOrganization.name} portal: ${generatedLink}`;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary" />
              Member Access Link
            </DialogTitle>
            <DialogDescription>
              Generate a secure, expiring link for {member.full_name} to access their portal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!generatedLink ? (
              <div className="space-y-3">
                <label className="text-sm font-medium">Link Purpose</label>
                <RadioGroup
                  value={purpose}
                  onValueChange={(val: any) => setPurpose(val)}
                  className="flex flex-col space-y-2"
                >
                  {!member.pin_setup_at && (
                    <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setPurpose('PIN_SETUP')}>
                      <RadioGroupItem value="PIN_SETUP" id="pin_setup" />
                      <Label htmlFor="pin_setup" className="flex-1 cursor-pointer">
                        <div className="font-medium">PIN Setup</div>
                        <div className="text-xs text-muted-foreground">(Expires in 7 days.)</div>
                      </Label>
                    </div>
                  )}
                  {member.pin_setup_at && (
                    <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setPurpose('PIN_RESET')}>
                      <RadioGroupItem value="PIN_RESET" id="pin_reset" />
                      <Label htmlFor="pin_reset" className="flex-1 cursor-pointer">
                        <div className="font-medium">PIN Reset</div>
                        <div className="text-xs text-muted-foreground">(Expires in 1 hour.)</div>
                      </Label>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setPurpose('VIEW_PROFILE')}>
                    <RadioGroupItem value="VIEW_PROFILE" id="view_profile" />
                    <Label htmlFor="view_profile" className="flex-1 cursor-pointer">
                      <div className="font-medium">View Profile</div>
                      <div className="text-xs text-muted-foreground">(Expires in 24 hours.)</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-md border text-sm font-mono break-all flex justify-between items-center gap-2">
                  <span>{generatedLink}</span>
                  <CopyToClipboard text={generatedLink} className="shrink-0" />
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    variant="secondary"
                    onClick={() => setShowSmsDialog(true)}
                    disabled={!member.phone}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send via SMS
                  </Button>
                </div>
                {!member.phone && (
                  <p className="text-xs text-destructive text-center">
                    Cannot send SMS: Member has no phone number on file.
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              {generatedLink ? 'Close' : 'Cancel'}
            </Button>
            {!generatedLink && (
              <Button onClick={handleGenerate} disabled={generateLinkMutation.isPending}>
                {generateLinkMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Link
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showSmsDialog && member.phone && generatedLink && (
        <QuickSmsDialog
          isOpen={showSmsDialog}
          onOpenChange={setShowSmsDialog}
          recipientName={member.full_name}
          recipientPhone={member.phone}
          memberId={member.id}
          defaultMessage={getSmsMessage()}
        />
      )}
    </>
  );
}
