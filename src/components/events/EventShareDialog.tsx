import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { EventActivityWithRelations } from '@/types/events';

interface EventShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventActivityWithRelations | null;
}

export const EventShareDialog: React.FC<EventShareDialogProps> = ({
  open,
  onOpenChange,
  event,
}) => {
  const [phone, setPhone] = useState('');
  const [groupLink, setGroupLink] = useState('');

  const message = useMemo(() => {
    const e = event;
    if (!e) return '';
    const typeEmoji =
      e.type === 'announcement' ? '📣' : e.type === 'activity' ? '🎯' : '📅';
    const title = `${typeEmoji} ${e.title}`;
    const start = e.start_time ? new Date(e.start_time) : null;
    const end = e.end_time ? new Date(e.end_time) : null;
    const dateLine = start
      ? `🗓️ ${start.toLocaleDateString()} ${start.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`
      : '';
    const endLine = end
      ? ` → ${end.toLocaleDateString()} ${end.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`
      : '';
    const locLine = e.location ? `\n📍 ${e.location}` : '';
    const branchLine = e.branch_name ? `\n⛪ ${e.branch_name}` : '';
    const desc = e.description ? `\n\n${e.description}` : '';
    return `${title}\n${dateLine}${endLine}${locLine}${branchLine}${desc}`.trim();
  }, [event]);

  const shareToNumber = () => {
    if (!phone || !message) return;
    const digits = phone.replace(/\D/g, '');
    if (!digits) return;
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const shareViaWeb = () => {
    if (!message) return;
    const url = `https://web.whatsapp.com/send?text=${encodeURIComponent(
      message
    )}`;
    navigator.clipboard?.writeText(message).catch(() => {});
    toast.success('Event details copied to clipboard');
    window.open(url, '_blank');
  };

  const openGroupLink = () => {
    if (!groupLink) return;
    window.open(groupLink, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Share via WhatsApp</DialogTitle>
          <DialogDescription>
            Send the event details with emojis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Preview</Label>
            <div className="rounded-md border bg-muted/30 text-sm p-3 whitespace-pre-line">
              {message || '-'}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>WhatsApp Number</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 233XXXXXXXXX"
              />
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={shareToNumber}
                  disabled={!phone || !message}
                  className="text-xs"
                >
                  Share to Number
                </Button>
                <Button
                  variant="outline"
                  onClick={shareViaWeb}
                  disabled={!message}
                  className="text-xs"
                >
                  Share via WhatsApp Web
                </Button>
              </div>
            </div>
            <div>
              <Label>WhatsApp Group Link</Label>
              <Input
                value={groupLink}
                onChange={(e) => setGroupLink(e.target.value)}
                placeholder="Paste group invite link"
              />
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={openGroupLink}
                  disabled={!groupLink}
                  className="text-xs"
                >
                  Open Group Link
                </Button>
                <Button
                  variant="outline"
                  onClick={shareViaWeb}
                  disabled={!message}
                  className="text-xs"
                >
                  Share via WhatsApp Web
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
