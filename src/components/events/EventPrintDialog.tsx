import React, { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useReactToPrint } from 'react-to-print';
import type { EventActivityWithRelations } from '@/types/events';
import { format } from 'date-fns';

interface EventPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: EventActivityWithRelations[];
}

export const EventPrintDialog: React.FC<EventPrintDialogProps> = ({
  open,
  onOpenChange,
  events,
}) => {
  const { currentOrganization } = useOrganization();
  const orgName = currentOrganization?.name || 'Organization';
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const PRINT_PAGE_STYLE = `
    @page { margin: 18mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
      .events-sheet { border: 1px solid #e5e7eb; }
      .org-logo { width: 44px; height: 44px; object-fit: contain; border-radius: 6px; border: 1px solid #e5e7eb; }
      .title { font-weight: 800; }
    }
  `;

  const print = useReactToPrint({
    contentRef: contentRef as React.RefObject<HTMLElement>,
    documentTitle: `Events and Activities`,
    pageStyle: PRINT_PAGE_STYLE,
    onAfterPrint: () => setIsPrinting(false),
  });

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await print();
    } catch (err) {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Print Events</DialogTitle>
          <DialogDescription>
            Preview and print the selected events.
          </DialogDescription>
        </DialogHeader>

        <div
          ref={contentRef}
          className="events-sheet rounded-lg border bg-card text-card-foreground p-6 space-y-6"
        >
          <div className="flex items-start gap-3">
            {currentOrganization?.logo ? (
              <img
                src={currentOrganization.logo}
                alt={`${orgName} Logo`}
                className="org-logo w-12 h-12 rounded-full"
              />
            ) : (
              <div className="org-logo w-11 h-11 rounded-md border flex items-center justify-center text-xs text-muted-foreground">
                Logo
              </div>
            )}
            <div>
              <div className="text-base font-semibold">{orgName}</div>
              {currentOrganization?.address && (
                <div className="text-xs text-muted-foreground">
                  {currentOrganization.address}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="title text-xl font-extrabold">
              Events & Activities
            </div>
            <div className="text-xs text-muted-foreground">
              Total: {events.length}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            {events.map((evt) => {
              const start = evt.start_time ? new Date(evt.start_time) : null;
              const end = evt.end_time ? new Date(evt.end_time) : null;
              return (
                <div key={evt.id} className="rounded-md border p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="text-lg font-semibold">{evt.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {evt.type?.toUpperCase()}{' '}
                        {evt.category ? `• ${evt.category}` : ''}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      {start && (
                        <div>
                          <span className="font-medium">Start:</span>{' '}
                          {format(start, 'MMM d, yyyy h:mm aa')}
                        </div>
                      )}
                      {end && (
                        <div>
                          <span className="font-medium">End:</span>{' '}
                          {format(end, 'MMM d, yyyy h:mm aa')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    <div>
                      <span className="font-medium">Location:</span>{' '}
                      {evt.location || '-'}
                    </div>
                    {evt.branch_name && (
                      <div>
                        <span className="font-medium">Branch:</span>{' '}
                        {evt.branch_name}
                      </div>
                    )}
                    {evt.description && (
                      <div className="mt-2 whitespace-pre-line">
                        {evt.description}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPrinting}
          >
            Close
          </Button>
          <Button
            onClick={handlePrint}
            disabled={isPrinting || events.length === 0}
          >
            {isPrinting ? 'Printing…' : 'Print'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
