import type {
  TableAction,
  TableColumn,
} from '@/components/finance/FinanceDataTable';
import { FinanceDataTable } from '@/components/finance/FinanceDataTable';
import { FinanceFilterBar } from '@/components/finance/FinanceFilterBar';
import { FinanceReportGenerator } from '@/components/finance/FinanceReportGenerator';
import { FinanceStatsCards } from '@/components/finance/FinanceStatsCards';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type {
  ContributionFormData,
  ContributionRecord,
  ContributionType,
  FinanceFilter,
  PaymentMethod,
} from '@/types/finance';
import { format } from 'date-fns';
import { CalendarIcon, Edit, Eye, Heart, Trash2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';

const Contributions: React.FC = () => {
  // Mock data for contributions
  const [contributions, setContributions] = useState<ContributionRecord[]>([
    {
      id: 'cont-1',
      organization_id: 'org-1',
      branch_id: 'branch-1',
      member_id: 'member-1',
      member_name: 'John Smith',
      amount: 500.0,
      contribution_type: 'tithe',
      payment_method: 'check',
      date: '2024-01-15',
      description: 'Monthly tithe',
      envelope_number: '123',
      tax_deductible: true,
      receipt_issued: true,
      receipt_number: 'REC-001',
      created_by: 'admin',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 'cont-2',
      organization_id: 'org-1',
      branch_id: 'branch-1',
      member_id: 'member-2',
      member_name: 'Mary Johnson',
      amount: 250.0,
      contribution_type: 'offering',
      payment_method: 'cash',
      date: '2024-01-14',
      description: 'Sunday offering',
      tax_deductible: true,
      receipt_issued: false,
      created_by: 'admin',
      created_at: '2024-01-14T11:00:00Z',
      updated_at: '2024-01-14T11:00:00Z',
    },
  ]);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [
    selectedContribution,
    setSelectedContribution,
  ] = useState<ContributionRecord | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FinanceFilter>({
    date_filter: { type: 'custom', start_date: '', end_date: '' },
    category_filter: [],
    member_filter: [],
    amount_range: { min: 0, max: 0 },
    payment_method_filter: [],
    status_filter: [],
  });

  // Form state
  const [formData, setFormData] = useState<ContributionFormData>({
    member_id: 'member-1',
    amount: 0,
    contribution_type: 'tithe',
    payment_method: 'cash',
    date: new Date().toISOString().split('T')[0],
    description: '',
    notes: '',
    envelope_number: '',
    tax_deductible: true,
  });

  // Mock member options
  const memberOptions = [
    { value: 'member-1', label: 'John Smith' },
    { value: 'member-2', label: 'Mary Johnson' },
    { value: 'member-3', label: 'David Wilson' },
    { value: 'member-4', label: 'Sarah Brown' },
  ];

  // Filter options
  const filterOptions = {
    contributionTypes: [
      { value: 'tithe', label: 'Tithe' },
      { value: 'offering', label: 'Offering' },
      { value: 'special_offering', label: 'Special Offering' },
      { value: 'building_fund', label: 'Building Fund' },
      { value: 'missions', label: 'Missions' },
      { value: 'pledge_payment', label: 'Pledge Payment' },
      { value: 'donation', label: 'Donation' },
      { value: 'other', label: 'Other' },
    ],
    paymentMethods: [
      { value: 'cash', label: 'Cash' },
      { value: 'check', label: 'Check' },
      { value: 'credit_card', label: 'Credit Card' },
      { value: 'debit_card', label: 'Debit Card' },
      { value: 'bank_transfer', label: 'Bank Transfer' },
      { value: 'mobile_payment', label: 'Mobile Payment' },
      { value: 'online', label: 'Online Payment' },
    ],
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      member_id: 'member-1',
      amount: 0,
      contribution_type: 'tithe',
      payment_method: 'cash',
      date: new Date().toISOString().split('T')[0],
      description: '',
      notes: '',
      envelope_number: '',
      tax_deductible: true,
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedContribution) {
      // Edit existing contribution
      const updatedContribution: ContributionRecord = {
        ...selectedContribution,
        ...formData,
        member_name:
          memberOptions.find((m) => m.value === formData.member_id)?.label ||
          '',
        updated_at: new Date().toISOString(),
        receipt_issued: false, // Reset receipt status when editing
      };

      setContributions((prev) =>
        prev.map((contribution) =>
          contribution.id === selectedContribution.id
            ? updatedContribution
            : contribution
        )
      );
      setIsEditDialogOpen(false);
    } else {
      // Add new contribution
      const newContribution: ContributionRecord = {
        id: Date.now().toString(),
        organization_id: 'org-1', // TODO: Get from context
        branch_id: 'branch-1', // TODO: Get from context
        created_by: 'user-1', // TODO: Get from auth context
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        member_name:
          memberOptions.find((m) => m.value === formData.member_id)?.label ||
          '',
        receipt_issued: false,
        ...formData,
      };

      setContributions((prev) => [...prev, newContribution]);
      setIsAddDialogOpen(false);
    }

    resetForm();
    setSelectedContribution(null);
  };

  // Handle edit
  const handleEdit = (contribution: ContributionRecord) => {
    setSelectedContribution(contribution);
    setFormData({
      member_id: contribution.member_id,
      amount: contribution.amount,
      contribution_type: contribution.contribution_type,
      payment_method: contribution.payment_method,
      date: contribution.date,
      description: contribution.description || '',
      notes: contribution.notes || '',
      envelope_number: contribution.envelope_number || '',
      tax_deductible: contribution.tax_deductible,
    });
    setIsEditDialogOpen(true);
  };

  // Handle view
  const handleView = (contribution: ContributionRecord) => {
    setSelectedContribution(contribution);
    setIsViewDialogOpen(true);
  };

  // Handle delete
  const handleDelete = (contribution: ContributionRecord) => {
    setContributions((prev) => prev.filter((c) => c.id !== contribution.id));
  };

  // Filtered contributions
  const filteredContributions = useMemo(() => {
    return contributions.filter((contribution) => {
      // Category filter (contribution type)
      if (
        filters.category_filter &&
        filters.category_filter.length > 0 &&
        !filters.category_filter.includes(contribution.contribution_type)
      ) {
        return false;
      }

      // Payment method filter
      if (
        filters.payment_method_filter &&
        filters.payment_method_filter.length > 0 &&
        !filters.payment_method_filter.includes(contribution.payment_method)
      ) {
        return false;
      }

      // TODO: Implement date filtering

      return true;
    });
  }, [contributions, filters]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalContributions = filteredContributions.reduce(
      (sum, contribution) => sum + contribution.amount,
      0
    );
    const recordCount = filteredContributions.length;
    const averageContribution =
      recordCount > 0 ? totalContributions / recordCount : 0;

    // Find top contributor
    const contributorTotals = filteredContributions.reduce(
      (acc, contribution) => {
        acc[contribution.member_name] =
          (acc[contribution.member_name] || 0) + contribution.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    const topContributor = Object.entries(contributorTotals).reduce(
      (max, [name, amount]) => (amount > max.amount ? { name, amount } : max),
      { name: 'None', amount: 0 }
    );

    return {
      totalContributions,
      recordCount,
      averageContribution,
      topContributor: topContributor.name,
      topContributorAmount: topContributor.amount,
    };
  }, [filteredContributions]);

  // Table columns
  const columns: TableColumn[] = [
    {
      key: 'member_name',
      label: 'Member',
      sortable: true,
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value) =>
        `GHS${Number(value).toLocaleString('en-US', {
          minimumFractionDigits: 2,
        })}`,
    },
    {
      key: 'contribution_type',
      label: 'Type',
      sortable: true,
      render: (value) =>
        String(value)
          .replace('_', ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase()),
    },
    {
      key: 'payment_method',
      label: 'Payment Method',
      sortable: true,
      render: (value) =>
        String(value)
          .replace('_', ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase()),
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value) => format(new Date(String(value)), 'MMM dd, yyyy'),
    },
    {
      key: 'envelope_number',
      label: 'Envelope #',
      render: (value) => value || '-',
    },
    {
      key: 'tax_deductible',
      label: 'Tax Deductible',
      render: (value) => (value ? 'Yes' : 'No'),
    },
    {
      key: 'receipt_issued',
      label: 'Receipt',
      render: (value) => (value ? '✓' : '✗'),
    },
  ];

  // Table actions
  const actions: TableAction[] = [
    {
      key: 'view',
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: handleView,
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEdit,
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDelete,
      variant: 'destructive',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Heart className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Contributions</h1>
        </div>

        {/* Report Generator */}
        <FinanceReportGenerator
          data={filteredContributions}
          title="Contribution Report"
          filters={filters}
          onGenerateReport={(config) => {
            console.log('Generating report with config:', config);
            // TODO: Implement report generation
          }}
        />
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Contribution</DialogTitle>
              <DialogDescription>
                Record a new contribution or donation.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="member">Member *</Label>
                  <Select
                    value={formData.member_id}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, member_id: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {memberOptions.map((member) => (
                        <SelectItem key={member.value} value={member.value}>
                          {member.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        amount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contributionType">Contribution Type *</Label>
                  <Select
                    value={formData.contribution_type}
                    onValueChange={(value: ContributionType) =>
                      setFormData((prev) => ({
                        ...prev,
                        contribution_type: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions.contributionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value: PaymentMethod) =>
                      setFormData((prev) => ({
                        ...prev,
                        payment_method: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions.paymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date
                          ? format(new Date(formData.date), 'PPP')
                          : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={
                          formData.date ? new Date(formData.date) : undefined
                        }
                        onSelect={(date) =>
                          date &&
                          setFormData((prev) => ({
                            ...prev,
                            date: date.toISOString().split('T')[0],
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="envelopeNumber">Envelope Number</Label>
                  <Input
                    id="envelopeNumber"
                    value={formData.envelope_number}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        envelope_number: e.target.value,
                      }))
                    }
                    placeholder="Envelope number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Brief description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Additional notes"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="taxDeductible"
                  checked={formData.tax_deductible}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      tax_deductible: !!checked,
                    }))
                  }
                />
                <Label htmlFor="taxDeductible">Tax deductible</Label>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Contribution</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <FinanceStatsCards
        stats={[
          {
            id: 'total_contributions',
            title: 'Total Contributions',
            value: `GHS${stats.totalContributions.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}`,
            icon: <span className="text-green-600">💰</span>,
            color: 'default',
          },
          {
            id: 'contribution_records',
            title: 'Contribution Records',
            value: stats.recordCount.toString(),
            icon: <span>📊</span>,
            subtitle: 'total entries',
          },
          {
            id: 'avg_contribution',
            title: 'Average Contribution',
            value: `GHS${stats.averageContribution.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}`,
            icon: <span>📈</span>,
            subtitle: 'per record',
          },
          {
            id: 'top_contributor',
            title: 'Top Contributor',
            value: stats.topContributor,
            subtitle: `GHS${stats.topContributorAmount.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}`,
            icon: <span>🏆</span>,
          },
        ]}
      />

      {/* Filter Bar */}
      <FinanceFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        categoryOptions={filterOptions.contributionTypes}
        paymentMethodOptions={filterOptions.paymentMethods}
        showAddButton={true}
        onAddClick={() => setIsAddDialogOpen(true)}
        addButtonLabel="Add Contribution"
      />

      {/* Data Table */}
      <FinanceDataTable
        data={filteredContributions}
        columns={columns}
        actions={actions}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Contribution</DialogTitle>
            <DialogDescription>
              Update the contribution information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-member">Member *</Label>
                <Select
                  value={formData.member_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, member_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {memberOptions.map((member) => (
                      <SelectItem key={member.value} value={member.value}>
                        {member.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Amount *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      amount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-contributionType">
                  Contribution Type *
                </Label>
                <Select
                  value={formData.contribution_type}
                  onValueChange={(value: ContributionType) =>
                    setFormData((prev) => ({
                      ...prev,
                      contribution_type: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.contributionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-paymentMethod">Payment Method *</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value: PaymentMethod) =>
                    setFormData((prev) => ({ ...prev, payment_method: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date
                        ? format(new Date(formData.date), 'PPP')
                        : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={
                        formData.date ? new Date(formData.date) : undefined
                      }
                      onSelect={(date) =>
                        date &&
                        setFormData((prev) => ({
                          ...prev,
                          date: date.toISOString().split('T')[0],
                        }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-envelopeNumber">Envelope Number</Label>
                <Input
                  id="edit-envelopeNumber"
                  value={formData.envelope_number}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      envelope_number: e.target.value,
                    }))
                  }
                  placeholder="Envelope number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Additional notes"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-taxDeductible"
                checked={formData.tax_deductible}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    tax_deductible: !!checked,
                  }))
                }
              />
              <Label htmlFor="edit-taxDeductible">Tax deductible</Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Contribution</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Contribution Details</DialogTitle>
          </DialogHeader>
          {selectedContribution && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Member
                  </Label>
                  <p className="font-semibold">
                    {selectedContribution.member_name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Amount
                  </Label>
                  <p className="text-lg font-semibold text-green-600">
                    GHS
                    {selectedContribution.amount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Type
                  </Label>
                  <p className="capitalize">
                    {selectedContribution.contribution_type.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Payment Method
                  </Label>
                  <p className="capitalize">
                    {selectedContribution.payment_method.replace('_', ' ')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Date
                  </Label>
                  <p>{format(new Date(selectedContribution.date), 'PPP')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Envelope #
                  </Label>
                  <p>{selectedContribution.envelope_number || 'N/A'}</p>
                </div>
              </div>

              {selectedContribution.description && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Description
                  </Label>
                  <p>{selectedContribution.description}</p>
                </div>
              )}

              {selectedContribution.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Notes
                  </Label>
                  <p>{selectedContribution.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Tax Deductible
                  </Label>
                  <p>{selectedContribution.tax_deductible ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Receipt Issued
                  </Label>
                  <p>{selectedContribution.receipt_issued ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {selectedContribution.receipt_number && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Receipt Number
                  </Label>
                  <p>{selectedContribution.receipt_number}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    Created:{' '}
                    {format(new Date(selectedContribution.created_at), 'PPp')}
                  </span>
                  <span>
                    Updated:{' '}
                    {format(new Date(selectedContribution.updated_at), 'PPp')}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false);
                if (selectedContribution) handleEdit(selectedContribution);
              }}
            >
              Edit Contribution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contributions;
