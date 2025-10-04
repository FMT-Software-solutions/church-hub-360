import React from 'react';
import { Printer, Download, FileImage, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PrintActionsProps {
  targetRef: React.RefObject<HTMLElement | HTMLDivElement | null>;
  fileName?: string;
  className?: string;
}

export default function PrintActions({ 
  targetRef, 
  fileName = 'member-document',
  className = '' 
}: PrintActionsProps) {
  const handlePrint = () => {
    if (!targetRef.current) {
      toast.error("Unable to print. Please try again.");
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Unable to open print window. Please check your browser settings.");
      return;
    }

    // Get the HTML content
    const content = targetRef.current.outerHTML;
    
    // Create the print document
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Document</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.5;
              color: #000;
              background: white;
            }
            
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .print\\:bg-white {
                background-color: white !important;
              }
              
              .shadow-lg {
                box-shadow: none !important;
              }
              
              .border-2 {
                border-width: 2px !important;
              }
            }
            
            /* Include Tailwind-like utilities */
            .flex { display: flex; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .justify-center { justify-content: center; }
            .gap-1 { gap: 0.25rem; }
            .gap-2 { gap: 0.5rem; }
            .gap-4 { gap: 1rem; }
            .gap-6 { gap: 1.5rem; }
            .gap-8 { gap: 2rem; }
            .p-3 { padding: 0.75rem; }
            .p-6 { padding: 1.5rem; }
            .p-8 { padding: 2rem; }
            .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
            .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
            .pb-4 { padding-bottom: 1rem; }
            .pb-6 { padding-bottom: 1.5rem; }
            .pt-6 { padding-top: 1.5rem; }
            .mb-1 { margin-bottom: 0.25rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-8 { margin-bottom: 2rem; }
            .mt-1 { margin-top: 0.25rem; }
            .mt-4 { margin-top: 1rem; }
            .mt-12 { margin-top: 3rem; }
            .mr-3 { margin-right: 0.75rem; }
            .h-4 { height: 1rem; }
            .h-5 { height: 1.25rem; }
            .h-8 { height: 2rem; }
            .h-12 { height: 3rem; }
            .h-16 { height: 4rem; }
            .h-32 { height: 8rem; }
            .w-4 { width: 1rem; }
            .w-5 { width: 1.25rem; }
            .w-6 { width: 1.5rem; }
            .w-8 { width: 2rem; }
            .w-12 { width: 3rem; }
            .w-16 { width: 4rem; }
            .w-20 { width: 5rem; }
            .w-32 { width: 8rem; }
            .min-h-screen { min-height: 100vh; }
            .text-xs { font-size: 0.75rem; }
            .text-sm { font-size: 0.875rem; }
            .text-base { font-size: 1rem; }
            .text-lg { font-size: 1.125rem; }
            .text-xl { font-size: 1.25rem; }
            .text-2xl { font-size: 1.5rem; }
            .font-medium { font-weight: 500; }
            .font-semibold { font-weight: 600; }
            .font-bold { font-weight: 700; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .capitalize { text-transform: capitalize; }
            .truncate { 
              overflow: hidden; 
              text-overflow: ellipsis; 
              white-space: nowrap; 
            }
            .whitespace-pre-wrap { white-space: pre-wrap; }
            .leading-tight { line-height: 1.25; }
            .rounded { border-radius: 0.25rem; }
            .rounded-lg { border-radius: 0.5rem; }
            .rounded-full { border-radius: 9999px; }
            .border { border-width: 1px; }
            .border-2 { border-width: 2px; }
            .border-4 { border-width: 4px; }
            .border-t-2 { border-top-width: 2px; }
            .border-b-2 { border-bottom-width: 2px; }
            .object-cover { object-fit: cover; }
            .object-contain { object-fit: contain; }
            .space-y-2 > * + * { margin-top: 0.5rem; }
            .space-y-4 > * + * { margin-top: 1rem; }
            .space-y-6 > * + * { margin-top: 1.5rem; }
            .grid { display: grid; }
            .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .col-span-1 { grid-column: span 1 / span 1; }
            .col-span-2 { grid-column: span 2 / span 2; }
            .relative { position: relative; }
            .absolute { position: absolute; }
            .top-0 { top: 0; }
            .right-0 { right: 0; }
            .bottom-0 { bottom: 0; }
            .left-0 { left: 0; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            .flex-shrink-0 { flex-shrink: 0; }
            .flex-1 { flex: 1 1 0%; }
            .min-w-0 { min-width: 0; }
            .overflow-hidden { overflow: hidden; }
            .transform { transform: translateX(var(--tw-translate-x, 0)) translateY(var(--tw-translate-y, 0)) rotate(var(--tw-rotate, 0)) skewX(var(--tw-skew-x, 0)) skewY(var(--tw-skew-y, 0)) scaleX(var(--tw-scale-x, 1)) scaleY(var(--tw-scale-y, 1)); }
            .rotate-45 { --tw-rotate: 45deg; }
            .translate-x-4 { --tw-translate-x: 1rem; }
            .-translate-y-4 { --tw-translate-y: -1rem; }
            .opacity-10 { opacity: 0.1; }
            .opacity-75 { opacity: 0.75; }
            .opacity-90 { opacity: 0.9; }
            
            /* Card styles */
            .card {
              background-color: white;
              border-radius: 0.5rem;
              border: 1px solid #e5e7eb;
              box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            }
            
            .badge {
              display: inline-flex;
              align-items: center;
              border-radius: 9999px;
              padding: 0.25rem 0.75rem;
              font-size: 0.75rem;
              font-weight: 500;
              border: 1px solid transparent;
            }
            
            @media (min-width: 768px) {
              .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            }
            
            @media (min-width: 1024px) {
              .lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
              .lg\\:col-span-1 { grid-column: span 1 / span 1; }
              .lg\\:col-span-2 { grid-column: span 2 / span 2; }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };

    toast.success("Print dialog opened successfully.");
  };

  const handleDownloadImage = async () => {
    if (!targetRef.current) {
      toast.error("Unable to generate image. Please try again.");
      return;
    }

    try {
      toast.info("Please wait while we create your image...");

      const canvas = await html2canvas(targetRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: targetRef.current.scrollWidth,
        height: targetRef.current.scrollHeight,
      });

      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success("Image downloaded successfully.");
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error("Failed to generate image. Please try again.");
    }
  };

  const handleDownloadPDF = async () => {
    if (!targetRef.current) {
      toast.error("Unable to generate PDF. Please try again.");
      return;
    }

    try {
      toast.info("Please wait while we create your PDF...");

      const canvas = await html2canvas(targetRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: targetRef.current.scrollWidth,
        height: targetRef.current.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${fileName}.pdf`);

      toast.success("PDF downloaded successfully.");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Direct Print Button */}
      <Button
        onClick={handlePrint}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Printer className="h-4 w-4" />
        Print
      </Button>

      {/* Download Options Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleDownloadImage}>
            <FileImage className="h-4 w-4 mr-2" />
            Download as Image (PNG)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDownloadPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Download as PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}