import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { EmailReportDialog } from '@/components/finance';

interface ReportExportMenuProps {
  filenameBase: string;
  getRows: () => Array<Record<string, unknown>>;
  getSummary?: () => Array<[string, unknown]>;
  printRef?: React.RefObject<HTMLElement | null>;
  disabled?: boolean;
}

export function ReportExportMenu({ filenameBase, getRows, getSummary, printRef, disabled }: ReportExportMenuProps) {
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const handlePrint = useReactToPrint({ contentRef: printRef as any });

  const exportCSV = () => {
    const rows = getRows();
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(',')].concat(
      rows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filenameBase}.csv`);
  };

  const exportXLSX = () => {
    const rows = getRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    if (getSummary) {
      const summaryRows = getSummary();
      if (summaryRows && summaryRows.length > 0) {
        const ws2 = XLSX.utils.aoa_to_sheet(summaryRows);
        XLSX.utils.book_append_sheet(wb, ws2, 'Summary');
      }
    }
    XLSX.writeFile(wb, `${filenameBase}.xlsx`);
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(filenameBase, 10, 10);
    doc.setFontSize(10);
    let y = 18;
    if (getSummary) {
      const summary = getSummary();
      summary?.forEach(([k, v]) => { doc.text(`${k}: ${String(v)}`, 10, y); y += 6; });
      y += 4;
    }
    const rows = getRows();
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    const line = (txt: string) => { doc.text(txt, 10, y); y += 5; };
    line(headers.join(' | '));
    rows.slice(0, 100).forEach((r) => line(headers.map((h) => String(r[h] ?? '')).join(' | ')));
    doc.save(`${filenameBase}.pdf`);
  };

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={!!disabled}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={exportCSV} disabled={!!disabled}>CSV</DropdownMenuItem>
          <DropdownMenuItem onClick={exportXLSX} disabled={!!disabled}>XLSX</DropdownMenuItem>
          <DropdownMenuItem onClick={exportPDF} disabled={!!disabled}>PDF</DropdownMenuItem>
          <DropdownMenuItem onClick={handlePrint} disabled={!!disabled}>Print</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowEmailDialog(true)} disabled={!!disabled}>Email</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EmailReportDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        onSendEmail={async ({ recipients: _recipients, subject, message: _message }) => {
          // Prepare a simple PDF using current rows and summary for email attachment
          try {
            const { default: jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            let y = 10;
            doc.setFontSize(14);
            doc.text(subject || filenameBase, 10, y);
            y += 8;
            doc.setFontSize(10);
            const summary = getSummary ? getSummary() : [];
            if (summary && summary.length > 0) {
              summary.forEach(([k, v]) => { doc.text(`${k}: ${String(v)}`, 10, y); y += 6; });
              y += 4;
            }
            const rows = getRows();
            const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
            const line = (txt: string) => { doc.text(txt, 10, y); y += 5; };
            line(headers.join(' | '));
            rows.slice(0, 100).forEach((r) => line(headers.map((h) => String(r[h] ?? '')).join(' | ')));
            doc.save(`${filenameBase}.pdf`);
            setShowEmailDialog(false);
          } catch (e) {
            setShowEmailDialog(false);
          }
        }}
      />
    </div>
  );
}