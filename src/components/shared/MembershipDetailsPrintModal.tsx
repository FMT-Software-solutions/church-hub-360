import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, Printer } from 'lucide-react';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import * as htmlToImage from 'html-to-image';
import { MembershipDetailsPrint } from './MembershipDetailsPrint';
import type { Member, Organization } from '@/types';
import type { MemberTagAssignment } from '@/hooks/useMemberTagAssignments';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface MembershipDetailsPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  organization: Organization;
  assignments?: MemberTagAssignment[];
}

export function MembershipDetailsPrintModal({
  isOpen,
  onClose,
  member,
  organization,
  assignments,
}: MembershipDetailsPrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Member Details - ${member.first_name} ${member.last_name}`,
  });

  const handleSaveAsImage = async () => {
    if (!printRef.current) return;

    try {
      // Use html-to-image for better OKLCH color support and consistency
      const dataUrl = await htmlToImage.toPng(printRef.current, {
        quality: 1.0,
        pixelRatio: 2, // Higher resolution for better quality
        backgroundColor: '#ffffff', // White background
        style: {
          // Ensure the element is visible during capture
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `member-details-${member.first_name}-${member.last_name}.png`;
      link.href = dataUrl;
      link.click();

      import('sonner').then(({ toast }) => {
        toast.success('Member details saved successfully!');
      });
    } catch (error) {
      console.error('Save as image failed:', error);

      // Fallback to JPEG if PNG fails
      try {
        const dataUrl = await htmlToImage.toJpeg(printRef.current, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: '#ffffff', // White background for JPEG
        });

        const link = document.createElement('a');
        link.download = `member-details-${member.first_name}-${member.last_name}.jpg`;
        link.href = dataUrl;
        link.click();

        import('sonner').then(({ toast }) => {
          toast.success('Member details saved successfully!');
        });
      } catch (fallbackError) {
        console.error('All save methods failed:', fallbackError);
        import('sonner').then(({ toast }) => {
          toast.error(
            'Unable to save image. Please try printing instead or check your browser compatibility.'
          );
        });
      }
    }
  };

  const ActionButtons = () => (
    <div className="flex justify-center gap-2 md:px-4">
      <Button
        onClick={handlePrint}
        className="flex items-center gap-2 cursor-pointer"
        size="sm"
      >
        <Printer className="h-4 w-4" />
        Print Details
      </Button>
      <Button
        variant="outline"
        onClick={resolvedTheme === 'dark' ? undefined : handleSaveAsImage}
        className={cn('flex items-center gap-2 relative cursor-pointer')}
        size="sm"
        disabled={resolvedTheme === 'dark'}
      >
        <Download className="h-4 w-4" />
        Save as Image
        {resolvedTheme === 'dark' && (
          <span className="text-[9px] text-gray-400 absolute -bottom-4">
            (Not available in dark mode)
          </span>
        )}
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader className="flex flex-row gap-4 justify-between items-center w-full flex-wrap">
          <DialogTitle className="flex items-center justify-between pr-8 ">
            Member Details - {member.first_name} {member.last_name}
          </DialogTitle>
          <ActionButtons />
        </DialogHeader>

        <div className="space-y-6">
          {/* Print Preview */}
          <div className="overflow-hidden">
            <div ref={printRef} className="printable-content p-4 print:p-0">
              <MembershipDetailsPrint
                member={member}
                organization={organization}
                assignments={assignments}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <ActionButtons />
        </div>
      </DialogContent>
    </Dialog>
  );
}
