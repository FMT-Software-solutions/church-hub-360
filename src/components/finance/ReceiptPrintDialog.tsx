import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { IncomeResponseRow } from '@/types/finance';
import { useOrganization } from '@/contexts/OrganizationContext';
import { paymentMethodOptions } from '@/components/finance/constants';
import { format } from 'date-fns';
import { useUpdateIncome } from '@/hooks/finance/income';
import { supabase } from '@/utils/supabase';
import { useReactToPrint } from 'react-to-print';

interface ReceiptPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: IncomeResponseRow | null;
}

export const ReceiptPrintDialog: React.FC<ReceiptPrintDialogProps> = ({
  open,
  onOpenChange,
  record,
}) => {
  const { currentOrganization } = useOrganization();
  const updateIncome = useUpdateIncome();
  const orgName = currentOrganization?.name || 'Organization';

  const pmLabel = useMemo(() => {
    const v = record?.payment_method;
    if (!v) return '-';
    return paymentMethodOptions.find((opt) => opt.value === v)?.label || v;
  }, [record?.payment_method]);

  const formatCurrency = (amount?: number) =>
    typeof amount === 'number'
      ? `GHS${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : '-';

  const [finalReceiptNumber, setFinalReceiptNumber] = useState<string | null>(
    record?.receipt_number ?? null
  );
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false);
  useEffect(() => {
    setFinalReceiptNumber(record?.receipt_number ?? null);
  }, [record?.id, record?.receipt_number]);

  // Generate and show a unique receipt number when dialog opens (if missing)
  useEffect(() => {
    const doGenerate = async () => {
      if (!open || !record || record.receipt_number) return;
      setIsGeneratingNumber(true);
      try {
        const candidate = generateReceiptNumber();
        const unique = await ensureUniqueReceiptNumber(candidate);
        setFinalReceiptNumber(unique);
      } finally {
        setIsGeneratingNumber(false);
      }
    };
    doGenerate();
  }, [open, record]);

  const generateReceiptNumber = (): string => {
    const orgCode = (currentOrganization?.name || 'ORG')
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase();
    const datePart = format(new Date(), 'yyMMdd-HHmm');
    const rand = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `RCPT-${orgCode}-${datePart}-${rand}`;
  };

  const ensureUniqueReceiptNumber = async (
    candidate: string
  ): Promise<string> => {
    if (!currentOrganization?.id) return candidate;
    let attempt = candidate;
    for (let i = 0; i < 3; i++) {
      const { data, error } = await supabase
        .from('income')
        .select('id')
        .eq('organization_id', currentOrganization.id)
        .eq('receipt_number', attempt)
        .limit(1);
      if (error) break; // fall back to attempt
      if (!data || data.length === 0) return attempt;
      attempt = `${candidate}-${Math.floor(Math.random() * 1000)}`;
    }
    return attempt;
  };

  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const PRINT_PAGE_STYLE = `
    @page { margin: 18mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
      .receipt { border: 1px solid #e5e7eb; }
      .org-logo { width: 44px; height: 44px; object-fit: contain; border-radius: 6px; border: 1px solid #e5e7eb; image-rendering: -webkit-optimize-contrast; }
      .title { font-weight: 800; }
      .amount { font-weight: 800; }
    }
  `;

  const print = useReactToPrint({
    contentRef: receiptRef as React.RefObject<HTMLElement>,
    documentTitle: `Receipt ${finalReceiptNumber ?? ''}`.trim(),
    pageStyle: PRINT_PAGE_STYLE,
    onAfterPrint: () => setIsPrinting(false),
  });

  const handlePrint = async () => {
    if (!record) return;
    setIsPrinting(true);
    try {
      // Ensure receipt number exists and persist before printing
      let receiptNum = finalReceiptNumber;
      if (!receiptNum) {
        receiptNum = await ensureUniqueReceiptNumber(generateReceiptNumber());
        setFinalReceiptNumber(receiptNum);
      }
      if (record?.id && receiptNum) {
        try {
          await updateIncome.mutateAsync({
            id: record.id,
            updates: { receipt_number: receiptNum, receipt_issued: true },
          });
        } catch (err) {
          console.error('Persist failed before print:', err);
        }
      }

      await print();
    } catch (err) {
      console.error('React-to-print failed:', err);
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
          <DialogDescription>
            Preview and print a receipt for this record.
          </DialogDescription>
        </DialogHeader>

        {/* Receipt Preview */}
        <div
          ref={receiptRef}
          className="receipt rounded-lg border bg-card text-card-foreground p-6"
        >
          {/* Header with Logo and Title */}
          <div className="header">
            <div className="brand flex items-start gap-3">
              {currentOrganization?.logo ? (
                <img
                  src={currentOrganization.logo}
                  alt={`${orgName} Logo`}
                  className="org-logo w-10 h-10 rounded-full overflow-hidden"
                />
              ) : (
                <div className="org-logo w-11 h-11 rounded-md border flex items-center justify-center text-xs text-muted-foreground">
                  Logo
                </div>
              )}

              <div>
                <div className="org-name text-base font-semibold">
                  {orgName}
                </div>
                {currentOrganization?.address && (
                  <div className="org-sub text-xs text-muted-foreground">
                    {currentOrganization.address}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="title-block text-right mt-4">
            <div className="title text-xl font-extrabold">Official Receipt</div>
            <div className="rec-num text-xs text-muted-foreground">
              # {finalReceiptNumber || (isGeneratingNumber ? 'Generating…' : 'Pending')}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="row flex gap-4 items-center">
              <span className="label text-sm text-muted-foreground">
                Income Type
              </span>
              <span className="value font-medium">
                {String(record?.income_type || 'income')
                  .replace('_', ' ')
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            </div>
            <div className="row flex gap-4 items-center">
              <span className="label text-sm text-muted-foreground">
                Category
              </span>
              <span className="value font-medium">
                {record?.extended_income_type || '-'}
              </span>
            </div>
            <div className="row flex gap-4 items-center">
              <span className="label text-sm text-muted-foreground">
                Source
              </span>
              <span className="value font-medium">
                {record?.contributor_name || record?.source || '-'}
              </span>
            </div>
            {record?.occasion_name && (
              <div className="row flex gap-4 items-center">
                <span className="label text-sm text-muted-foreground">
                  Occasion
                </span>
                <span className="value font-medium">
                  {record.occasion_name}
                </span>
              </div>
            )}
            <div className="row flex gap-4 items-center">
              <span className="label text-sm text-muted-foreground">Date</span>
              <span className="value font-medium">
                {record?.date
                  ? format(new Date(record.date), 'MMM dd, yyyy HH:mm')
                  : '-'}
              </span>
            </div>
            <div className="row flex gap-4 items-center">
              <span className="label text-sm text-muted-foreground">
                Payment Method
              </span>
              <span className="value font-medium">{pmLabel}</span>
            </div>
            {record?.envelope_number && (
              <div className="row flex gap-4 items-center">
                <span className="label text-sm text-muted-foreground">
                  Envelope #
                </span>
                <span className="value font-medium">
                  {record.envelope_number}
                </span>
              </div>
            )}
            {typeof record?.tax_deductible === 'boolean' && (
              <div className="row flex gap-4 items-center">
                <span className="label text-sm text-muted-foreground">
                  Tax Deductible
                </span>
                <span className="value font-medium">
                  {record.tax_deductible ? 'Yes' : 'No'}
                </span>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* Amount and Receipt Number */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Receipt #: {finalReceiptNumber || 'N/A'}
            </div>
            <div className="amount text-2xl font-bold">
              {formatCurrency(record?.amount)}
            </div>
          </div>

          <div className="footer mt-6 text-center text-sm text-muted-foreground">
            Thank you for your support.
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handlePrint} disabled={isPrinting}>
            {isPrinting ? 'Printing…' : 'Print'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptPrintDialog;
