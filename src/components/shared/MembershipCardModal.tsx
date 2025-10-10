import { TEMPLATE_COMPONENTS } from '@/components/shared/membershipCardTemplates';
import { TemplateSelectionDrawer } from '@/components/shared/TemplateSelectionDrawer';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useTemplateSelection } from '@/hooks/useTemplateSelection';
import type { Organization } from '@/types';
import { Download, IdCard, Printer } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import * as htmlToImage from 'html-to-image';

interface MemberData {
  first_name: string;
  last_name: string;
  email?: string | null;
  membership_id: string;
  date_of_birth?: string | null;
  gender?: string | null;
  profile_image_url?: string | null;
  date_joined?: string | null;
}

interface MembershipCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: MemberData;
}

export function MembershipCardModal({
  isOpen,
  onClose,
  member,
}: MembershipCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { currentOrganization } = useOrganization();
  const {
    selectedTemplateId,
    selectTemplate,
    isLoading,
  } = useTemplateSelection();
  const [isTemplateDrawerOpen, setIsTemplateDrawerOpen] = useState(false);
  const [forceRender, setForceRender] = useState(0);

  // Force re-render when modal opens to ensure template selection is synced
  useEffect(() => {
    if (isOpen && !isLoading) {
      // Force a re-render to ensure the latest template is displayed
      setForceRender((prev) => prev + 1);
    }
  }, [isOpen, isLoading, selectedTemplateId]);

  const handlePrint = useReactToPrint({
    contentRef: cardRef,
    documentTitle: `Membership Card - ${member.first_name} ${member.last_name}`,
  });

  const handleSaveAsImage = async () => {
    if (!cardRef.current) return;

    try {
      // Use html-to-image for better OKLCH color support and consistency
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 3, // Higher resolution for better quality
        backgroundColor: undefined, // Preserve transparency
        style: {
          // Ensure the element is visible during capture
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `membership-card-${member.first_name}-${member.last_name}.png`;
      link.href = dataUrl;
      link.click();

      import('sonner').then(({ toast }) => {
        toast.success('Membership card saved successfully!');
      });
    } catch (error) {
      console.error('Save as image failed:', error);

      // Fallback to JPEG if PNG fails
      try {
        const dataUrl = await htmlToImage.toJpeg(cardRef.current, {
          quality: 0.95,
          pixelRatio: 3,
          backgroundColor: '#ffffff', // White background for JPEG
        });

        const link = document.createElement('a');
        link.download = `membership-card-${member.first_name}-${member.last_name}.jpg`;
        link.href = dataUrl;
        link.click();

        import('sonner').then(({ toast }) => {
          toast.success('Membership card saved successfully!');
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

  // Get the selected template component
  const TemplateComponent =
    TEMPLATE_COMPONENTS[
      selectedTemplateId as keyof typeof TEMPLATE_COMPONENTS
    ] || null;

  // Don't render the modal content until template selection is loaded
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Membership Card</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center h-64">
            <div className="text-muted-foreground">Loading template...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            Membership Card
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTemplateDrawerOpen(true)}
              className="flex items-center gap-2"
            >
              <IdCard className="h-4 w-4" />
              Choose Template
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 border-2 rounded-md px-2 py-4">
          {/* Template Selection Button */}
          <div className="flex justify-end"></div>

          {/* Card Preview */}
          <div className="flex justify-center" key={forceRender}>
            <div ref={cardRef} className="printable-content">
              {TemplateComponent ? (
                <TemplateComponent
                  member={member}
                  organization={currentOrganization as Organization}
                />
              ) : (
                <div className="w-[400px] h-[250px] bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                  <p className="text-gray-500">Template not found</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Print Card
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveAsImage}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Save as Image
            </Button>
          </div>
        </div>

        {/* Template Selection Drawer */}
        <TemplateSelectionDrawer
          isOpen={isTemplateDrawerOpen}
          onClose={() => setIsTemplateDrawerOpen(false)}
          onTemplateSelect={(templateId) => {
            selectTemplate(templateId);
            setIsTemplateDrawerOpen(false);
          }}
          selectedTemplateId={selectedTemplateId}
        />
      </DialogContent>
    </Dialog>
  );
}
