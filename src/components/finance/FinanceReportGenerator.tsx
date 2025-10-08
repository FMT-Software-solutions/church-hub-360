import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Printer,
  Mail,
} from 'lucide-react';
import type { ReportConfig, DateFilter } from '@/types/finance';
import { format } from 'date-fns';

interface FinanceReportGeneratorProps {
  title: string;
  data: any[];
  filters: any;
  onGenerateReport: (config: ReportConfig) => void;
  loading?: boolean;
  availableFormats?: ReportFormat[];
  availableGroupBy?: GroupByOption[];
  availableSortBy?: SortByOption[];
}

interface ReportFormat {
  value: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

interface GroupByOption {
  value: string;
  label: string;
}

interface SortByOption {
  value: string;
  label: string;
}

const defaultFormats: ReportFormat[] = [
  {
    value: 'pdf',
    label: 'PDF Report',
    icon: <FileText className="h-4 w-4" />,
    description: 'Formatted report for printing or sharing',
  },
  {
    value: 'excel',
    label: 'Excel Spreadsheet',
    icon: <FileSpreadsheet className="h-4 w-4" />,
    description: 'Data in spreadsheet format for analysis',
  },
  {
    value: 'csv',
    label: 'CSV File',
    icon: <FileSpreadsheet className="h-4 w-4" />,
    description: 'Raw data in comma-separated format',
  },
  {
    value: 'print',
    label: 'Print Preview',
    icon: <Printer className="h-4 w-4" />,
    description: 'Open print-friendly version',
  },
];

const defaultGroupByOptions: GroupByOption[] = [
  { value: 'date', label: 'Date' },
  { value: 'category', label: 'Category' },
  { value: 'member', label: 'Member' },
  { value: 'payment_method', label: 'Payment Method' },
  { value: 'amount_range', label: 'Amount Range' },
];

const defaultSortByOptions: SortByOption[] = [
  { value: 'date', label: 'Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'category', label: 'Category' },
  { value: 'member_name', label: 'Member Name' },
  { value: 'created_at', label: 'Created Date' },
];

export const FinanceReportGenerator: React.FC<FinanceReportGeneratorProps> = ({
  title,
  data,
  filters,
  onGenerateReport,
  loading = false,
  availableFormats = defaultFormats,
  availableGroupBy = defaultGroupByOptions,
  availableSortBy = defaultSortByOptions,
}) => {
  const [open, setOpen] = React.useState(false);
  const [reportConfig, setReportConfig] = React.useState<ReportConfig>({
    title: `${title} Report`,
    date_range: filters.date_filter || { type: 'preset', preset: 'this_month' },
    filters,
    include_summary: true,
    include_details: true,
    sort_by: 'date',
    sort_order: 'desc',
  });

  // const handleGenerateReport = () => {
  //   onGenerateReport(reportConfig);
  //   setOpen(false);
  // };

  const updateConfig = (updates: Partial<ReportConfig>) => {
    setReportConfig((prev) => ({ ...prev, ...updates }));
  };

  const formatDateRange = (dateFilter: DateFilter) => {
    if (dateFilter.type === 'preset' && dateFilter.preset) {
      return dateFilter.preset.replace('_', ' ').toUpperCase();
    }

    if (dateFilter.start_date && dateFilter.end_date) {
      return `${format(
        new Date(dateFilter.start_date),
        'MMM dd, yyyy'
      )} - ${format(new Date(dateFilter.end_date), 'MMM dd, yyyy')}`;
    }

    return 'Custom Range';
  };

  const getRecordCount = () => {
    return data.length;
  };

  const getTotalAmount = () => {
    return data.reduce((sum, record) => sum + (record.amount || 0), 0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Generate {title} Report</DialogTitle>
          <DialogDescription>
            Configure your report settings and choose the export format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Summary */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Report Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Date Range:</span>
                <div className="font-medium">
                  {formatDateRange(reportConfig.date_range)}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Records:</span>
                <div className="font-medium">{getRecordCount()} items</div>
              </div>
              <div>
                <span className="text-muted-foreground">Total Amount:</span>
                <div className="font-medium">
                  GHS{getTotalAmount().toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Filters Applied:</span>
                <div className="font-medium">
                  {
                    Object.keys(filters).filter(
                      (key) =>
                        key !== 'date_filter' && filters[key] !== undefined
                    ).length
                  }{' '}
                  active
                </div>
              </div>
            </div>
          </div>

          {/* Report Configuration */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="report-title">Report Title</Label>
              <Input
                id="report-title"
                value={reportConfig.title}
                onChange={(e) => updateConfig({ title: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Group By</Label>
                <Select
                  value={reportConfig.group_by || 'none'}
                  onValueChange={(value) =>
                    updateConfig({
                      group_by: value === 'none' ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="No grouping" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No grouping</SelectItem>
                    {availableGroupBy.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Sort By</Label>
                <div className="flex gap-2 mt-1">
                  <Select
                    value={reportConfig.sort_by || 'date'}
                    onValueChange={(value) => updateConfig({ sort_by: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSortBy.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={reportConfig.sort_order || 'desc'}
                    onValueChange={(value) =>
                      updateConfig({ sort_order: value as 'asc' | 'desc' })
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">↑ Asc</SelectItem>
                      <SelectItem value="desc">↓ Desc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Include Options */}
            <div>
              <Label>Include in Report</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-summary"
                    checked={reportConfig.include_summary}
                    onCheckedChange={(checked) =>
                      updateConfig({ include_summary: checked as boolean })
                    }
                  />
                  <Label htmlFor="include-summary" className="text-sm">
                    Summary statistics and charts
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-details"
                    checked={reportConfig.include_details}
                    onCheckedChange={(checked) =>
                      updateConfig({ include_details: checked as boolean })
                    }
                  />
                  <Label htmlFor="include-details" className="text-sm">
                    Detailed transaction list
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Export Format Selection */}
          <div>
            <Label>Export Format</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {availableFormats.map((format) => (
                <Button
                  key={format.value}
                  variant="outline"
                  className="h-auto p-4 justify-start"
                  onClick={() => {
                    // Handle format-specific generation
                    const configWithFormat = {
                      ...reportConfig,
                      format: format.value,
                    };
                    onGenerateReport(configWithFormat);
                    setOpen(false);
                  }}
                  disabled={loading}
                >
                  <div className="flex items-start space-x-3">
                    {format.icon}
                    <div className="text-left">
                      <div className="font-medium">{format.label}</div>
                      {format.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {format.description}
                        </div>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Quick export buttons for common formats
export const QuickExportButtons: React.FC<{
  onExport: (format: string) => void;
  loading?: boolean;
}> = ({ onExport, loading = false }) => {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onExport('pdf')}
        disabled={loading}
      >
        <FileText className="h-4 w-4 mr-1" />
        PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onExport('excel')}
        disabled={loading}
      >
        <FileSpreadsheet className="h-4 w-4 mr-1" />
        Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onExport('print')}
        disabled={loading}
      >
        <Printer className="h-4 w-4 mr-1" />
        Print
      </Button>
    </div>
  );
};

// Email report dialog
export const EmailReportDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendEmail: (config: {
    recipients: string[];
    subject: string;
    message: string;
  }) => void;
  loading?: boolean;
}> = ({ open, onOpenChange, onSendEmail, loading = false }) => {
  const [recipients, setRecipients] = React.useState('');
  const [subject, setSubject] = React.useState('Finance Report');
  const [message, setMessage] = React.useState(
    'Please find the attached finance report.'
  );

  const handleSend = () => {
    const recipientList = recipients
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);
    onSendEmail({ recipients: recipientList, subject, message });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Email Report</DialogTitle>
          <DialogDescription>
            Send the generated report via email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="recipients">Recipients</Label>
            <Input
              id="recipients"
              placeholder="email1@example.com, email2@example.com"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Separate multiple email addresses with commas
            </p>
          </div>

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={loading || !recipients.trim()}>
            <Mail className="h-4 w-4 mr-2" />
            Send Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
