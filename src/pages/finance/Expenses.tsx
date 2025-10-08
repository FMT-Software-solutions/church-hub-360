import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import React, { useMemo, useState } from 'react';

import {
  FinanceDataTable,
  FinanceFilterBar,
  FinanceReportGenerator,
  FinanceStatsCards,
} from '@/components/finance';
import type {
  TableAction,
  TableColumn,
} from '@/components/finance/FinanceDataTable';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { mockExpenseRecords } from '@/data/mock/finance';
import type {
  ExpenseCategory,
  ExpenseFormData,
  ExpenseRecord,
  FinanceFilter,
  PaymentMethod,
} from '@/types/finance';
import { format } from 'date-fns';
import { CalendarIcon, Edit, Eye, Trash2 } from 'lucide-react';

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(mockExpenseRecords);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(
    null
  );
  const [filters, setFilters] = useState<FinanceFilter>({
    date_filter: {
      type: 'preset',
      preset: 'this_month',
    },
    category_filter: [],
    payment_method_filter: [],
    status_filter: [],
  });

  // Form state
  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: 0,
    category: 'utilities',
    description: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    vendor: '',
    receipt_number: '',
    notes: '',
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      amount: 0,
      category: 'utilities',
      description: '',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      vendor: '',
      receipt_number: '',
      notes: '',
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedExpense) {
      // Edit existing expense
      const updatedExpense: ExpenseRecord = {
        ...selectedExpense,
        ...formData,
        updated_at: new Date().toISOString(),
        date: formData.date,
      };

      setExpenses((prev) =>
        prev.map((expense) =>
          expense.id === selectedExpense.id ? updatedExpense : expense
        )
      );
      setIsEditDialogOpen(false);
    } else {
      // Add new expense
      const newExpense: ExpenseRecord = {
        id: Date.now().toString(),
        organization_id: 'org-1', // TODO: Get from context
        branch_id: 'branch-1', // TODO: Get from context
        created_by: 'user-1', // TODO: Get from auth context
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...formData,
      };

      setExpenses((prev) => [newExpense, ...prev]);
      setIsAddDialogOpen(false);
    }

    resetForm();
    setSelectedExpense(null);
  };

  // Handle edit
  const handleEdit = (expense: ExpenseRecord) => {
    setSelectedExpense(expense);
    setFormData({
      amount: expense.amount,
      category: expense.category,
      description: expense.description || '',
      date: expense.date,
      payment_method: expense.payment_method,
      vendor: expense.vendor || '',
      receipt_number: expense.receipt_number || '',
      notes: expense.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  // Handle view
  const handleView = (expense: ExpenseRecord) => {
    setSelectedExpense(expense);
    setIsViewDialogOpen(true);
  };

  // Handle delete
  const handleDelete = (expense: ExpenseRecord) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
  };

  // Filter expenses based on current filters
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      // Category filter
      if (
        filters.category_filter &&
        filters.category_filter.length > 0 &&
        !filters.category_filter.includes(expense.category)
      ) {
        return false;
      }

      // Payment method filter
      if (
        filters.payment_method_filter &&
        filters.payment_method_filter.length > 0 &&
        !filters.payment_method_filter.includes(expense.payment_method)
      ) {
        return false;
      }

      // Date filter (simplified for now)
      // TODO: Implement proper date filtering based on date_filter structure

      return true;
    });
  }, [expenses, filters]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalExpenses = filteredExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const recordCount = filteredExpenses.length;
    const averageExpense = recordCount > 0 ? totalExpenses / recordCount : 0;

    // Find top category
    const categoryTotals = filteredExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const topCategoryEntry = Object.entries(categoryTotals).sort(
      ([, a], [, b]) => b - a
    )[0];
    const topCategory = topCategoryEntry ? topCategoryEntry[0] : 'N/A';
    const topCategoryAmount = topCategoryEntry ? topCategoryEntry[1] : 0;

    return {
      totalExpenses,
      recordCount,
      averageExpense,
      topCategory,
      topCategoryAmount,
    };
  }, [filteredExpenses]);

  // Table columns
  const columns: TableColumn[] = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value: string) => format(new Date(value), 'MMM dd, yyyy'),
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value: ExpenseCategory) => (
        <span className="capitalize">{value.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-red-600">
          GHS{value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'vendor',
      label: 'Vendor',
      sortable: true,
      render: (value: string | undefined) => value || '-',
    },
    {
      key: 'payment_method',
      label: 'Payment Method',
      sortable: true,
      render: (value: PaymentMethod) => (
        <span className="capitalize">{value.replace('_', ' ')}</span>
      ),
    },
  ];

  // Table actions
  const actions: TableAction[] = [
    {
      key: 'view',
      label: 'View Details',
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

  // Filter options
  const filterOptions = {
    categories: [
      { value: 'utilities', label: 'Utilities' },
      { value: 'maintenance', label: 'Maintenance' },
      { value: 'supplies', label: 'Supplies' },
      { value: 'equipment', label: 'Equipment' },
      { value: 'ministry', label: 'Ministry' },
      { value: 'administrative', label: 'Administrative' },
      { value: 'events', label: 'Events' },
      { value: 'other', label: 'Other' },
    ],
    paymentMethods: [
      { value: 'cash', label: 'Cash' },
      { value: 'check', label: 'Check' },
      { value: 'credit_card', label: 'Credit Card' },
      { value: 'bank_transfer', label: 'Bank Transfer' },
      { value: 'online', label: 'Online Payment' },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Track and manage church expenses and expenditures
          </p>
        </div>

        {/* Report Generator */}
        <FinanceReportGenerator
          data={filteredExpenses}
          title="Expense Report"
          filters={filters}
          onGenerateReport={(config) => {
            console.log('Generating report with config:', config);
            // TODO: Implement report generation
          }}
        />
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>
                Record a new expense for the church.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: ExpenseCategory) =>
                      setFormData((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions.categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Brief description of the expense"
                  required
                />
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
                  <Label htmlFor="vendor">Vendor</Label>
                  <Input
                    id="vendor"
                    value={formData.vendor}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vendor: e.target.value,
                      }))
                    }
                    placeholder="Vendor or supplier name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receiptNumber">Receipt Number</Label>
                  <Input
                    id="receiptNumber"
                    value={formData.receipt_number}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        receipt_number: e.target.value,
                      }))
                    }
                    placeholder="Receipt or invoice number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Additional notes or details"
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Expense</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <FinanceStatsCards
        stats={[
          {
            id: 'total_expenses',
            title: 'Total Expenses',
            value: `GHS${stats.totalExpenses.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}`,
            icon: <span className="text-red-600">💰</span>,
            color: 'destructive',
          },
          {
            id: 'expense_records',
            title: 'Expense Records',
            value: stats.recordCount.toString(),
            icon: <span>📊</span>,
            subtitle: 'total entries',
          },
          {
            id: 'avg_expense',
            title: 'Average Expense',
            value: `GHS${stats.averageExpense.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}`,
            icon: <span>📈</span>,
            subtitle: 'per record',
          },
          {
            id: 'top_category',
            title: 'Top Category',
            value: stats.topCategory.replace('_', ' '),
            subtitle: `GHS${stats.topCategoryAmount.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}`,
            icon: <span>🏷️</span>,
          },
        ]}
      />

      {/* Filter Bar */}
      <FinanceFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        categoryOptions={[
          { value: 'utilities', label: 'Utilities' },
          { value: 'maintenance', label: 'Maintenance' },
          { value: 'supplies', label: 'Supplies' },
          { value: 'equipment', label: 'Equipment' },
          { value: 'travel', label: 'Travel' },
          { value: 'food', label: 'Food & Catering' },
          { value: 'marketing', label: 'Marketing' },
          { value: 'insurance', label: 'Insurance' },
          { value: 'professional_services', label: 'Professional Services' },
          { value: 'other', label: 'Other' },
        ]}
        paymentMethodOptions={[
          { value: 'cash', label: 'Cash' },
          { value: 'check', label: 'Check' },
          { value: 'credit_card', label: 'Credit Card' },
          { value: 'debit_card', label: 'Debit Card' },
          { value: 'bank_transfer', label: 'Bank Transfer' },
          { value: 'online_payment', label: 'Online Payment' },
        ]}
        showAddButton={true}
        onAddClick={() => setIsAddDialogOpen(true)}
        addButtonLabel="Add Expense"
      />

      {/* Data Table */}
      <FinanceDataTable
        data={filteredExpenses}
        columns={columns}
        actions={actions}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update the expense information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: ExpenseCategory) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description of the expense"
                required
              />
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
                <Label htmlFor="edit-vendor">Vendor</Label>
                <Input
                  id="edit-vendor"
                  value={formData.vendor}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, vendor: e.target.value }))
                  }
                  placeholder="Vendor or supplier name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-receiptNumber">Receipt Number</Label>
                <Input
                  id="edit-receiptNumber"
                  value={formData.receipt_number}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      receipt_number: e.target.value,
                    }))
                  }
                  placeholder="Receipt or invoice number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Additional notes or details"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Expense</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Amount
                  </Label>
                  <p className="text-lg font-semibold text-red-600">
                    GHS
                    {selectedExpense.amount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Category
                  </Label>
                  <p className="capitalize">
                    {selectedExpense.category.replace('_', ' ')}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Description
                </Label>
                <p>{selectedExpense.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Date
                  </Label>
                  <p>{format(new Date(selectedExpense.date), 'PPP')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Payment Method
                  </Label>
                  <p className="capitalize">
                    {selectedExpense.payment_method.replace('_', ' ')}
                  </p>
                </div>
              </div>

              {selectedExpense.vendor && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Vendor
                  </Label>
                  <p>{selectedExpense.vendor}</p>
                </div>
              )}

              {selectedExpense.receipt_number && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Receipt Number
                  </Label>
                  <p>{selectedExpense.receipt_number}</p>
                </div>
              )}

              {selectedExpense.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Notes
                  </Label>
                  <p>{selectedExpense.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    Created:{' '}
                    {format(new Date(selectedExpense.created_at), 'PPp')}
                  </span>
                  <span>
                    Updated:{' '}
                    {format(new Date(selectedExpense.updated_at), 'PPp')}
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
                if (selectedExpense) handleEdit(selectedExpense);
              }}
            >
              Edit Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Expenses;
