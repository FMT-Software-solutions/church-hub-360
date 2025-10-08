import { useState } from 'react';
import { FileText, Copy, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

import type {
  BudgetPlan,
  BudgetPlanFormData,
  BudgetTemplate,
} from '@/types/finance';

interface BudgetFormProps {
  initialData?: Partial<BudgetPlanFormData>;
  existingBudgets?: BudgetPlan[];
  templates?: BudgetTemplate[];
  onSubmit: (data: BudgetPlanFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
  isLoading?: boolean;
}

export function BudgetForm({
  initialData = {},
  existingBudgets = [],
  templates = [],
  onSubmit,
  onCancel,
  isEditing = false,
  isLoading = false,
}: BudgetFormProps) {
  const [formData, setFormData] = useState<BudgetPlanFormData>({
    name: '',
    fiscal_year: new Date().getFullYear(),
    start_date: '',
    end_date: '',
    description: '',
    template_id: '',
    copy_from_previous: false,
    previous_budget_id: '',
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Budget name is required';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (
      formData.start_date &&
      formData.end_date &&
      formData.start_date >= formData.end_date
    ) {
      newErrors.end_date = 'End date must be after start date';
    }

    if (formData.copy_from_previous && !formData.previous_budget_id) {
      newErrors.previous_budget_id = 'Please select a budget to copy from';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleFieldChange = (field: keyof BudgetPlanFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const generateEndDate = (startDate: string, fiscalYear: number) => {
    if (startDate) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setFullYear(fiscalYear);
      end.setMonth(11, 31); // December 31st
      return end.toISOString().split('T')[0];
    }
    return '';
  };

  const handleStartDateChange = (startDate: string) => {
    handleFieldChange('start_date', startDate);
    if (startDate && !formData.end_date) {
      const endDate = generateEndDate(startDate, formData.fiscal_year);
      handleFieldChange('end_date', endDate);
    }
  };

  const handleFiscalYearChange = (year: number) => {
    handleFieldChange('fiscal_year', year);
    if (formData.start_date) {
      const endDate = generateEndDate(formData.start_date, year);
      handleFieldChange('end_date', endDate);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {isEditing ? 'Edit Budget Plan' : 'Create New Budget Plan'}
        </CardTitle>
        <CardDescription>
          {isEditing
            ? 'Update the budget plan details and settings'
            : 'Set up a new budget plan for your organization'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget-name">
                  Budget Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="budget-name"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="e.g., 2025 Annual Budget"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="fiscal-year">
                  Fiscal Year <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fiscal-year"
                  type="number"
                  value={formData.fiscal_year}
                  onChange={(e) =>
                    handleFiscalYearChange(parseInt(e.target.value))
                  }
                  min={new Date().getFullYear() - 5}
                  max={new Date().getFullYear() + 10}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className={errors.start_date ? 'border-red-500' : ''}
                />
                {errors.start_date && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.start_date}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="end-date">
                  End Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    handleFieldChange('end_date', e.target.value)
                  }
                  className={errors.end_date ? 'border-red-500' : ''}
                />
                {errors.end_date && (
                  <p className="text-sm text-red-500 mt-1">{errors.end_date}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleFieldChange('description', e.target.value)
                }
                placeholder="Optional description for this budget plan"
                rows={3}
              />
            </div>
          </div>

          {/* Template and Copy Options */}
          {!isEditing && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Budget Setup Options</h3>

              {templates.length > 0 && (
                <div>
                  <Label htmlFor="template">Use Budget Template</Label>
                  <Select
                    value={formData.template_id}
                    onValueChange={(value) =>
                      handleFieldChange('template_id', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No template</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{template.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {template.is_default ? 'Default' : 'Custom'}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {existingBudgets.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="copy-previous"
                      checked={formData.copy_from_previous}
                      onCheckedChange={(checked) => {
                        handleFieldChange(
                          'copy_from_previous',
                          checked as boolean
                        );
                        if (!checked) {
                          handleFieldChange('previous_budget_id', '');
                        }
                      }}
                    />
                    <Label
                      htmlFor="copy-previous"
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy from previous budget
                    </Label>
                  </div>

                  {formData.copy_from_previous && (
                    <div>
                      <Label htmlFor="previous-budget">
                        Previous Budget <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.previous_budget_id}
                        onValueChange={(value) =>
                          handleFieldChange('previous_budget_id', value)
                        }
                      >
                        <SelectTrigger
                          className={
                            errors.previous_budget_id ? 'border-red-500' : ''
                          }
                        >
                          <SelectValue placeholder="Select previous budget" />
                        </SelectTrigger>
                        <SelectContent>
                          {existingBudgets.map((budget) => (
                            <SelectItem key={budget.id} value={budget.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{budget.name}</span>
                                <div className="flex items-center gap-2 ml-2">
                                  <Badge variant="outline">
                                    FY {budget.fiscal_year}
                                  </Badge>
                                  <Badge
                                    variant={
                                      budget.status === 'active'
                                        ? 'default'
                                        : budget.status === 'approved'
                                        ? 'secondary'
                                        : 'outline'
                                    }
                                  >
                                    {budget.status}
                                  </Badge>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.previous_budget_id && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.previous_budget_id}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update Budget' : 'Create Budget'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
