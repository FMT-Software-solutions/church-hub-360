import {
  AlertTriangle,
  DollarSign,
  Edit,
  Plus,
  Tags,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import type {
  BudgetAllocation,
  BudgetAllocationFormData,
} from '@/types/finance';
import { defaultTagCategories } from '@/utils/defaultTagsData';

interface CategoryAllocationProps {
  allocations: BudgetAllocation[];
  budgetPlanId: string;
  totalBudget: number;
  onCreateAllocation: (data: BudgetAllocationFormData) => void;
  onUpdateAllocation: (
    id: string,
    data: Partial<BudgetAllocationFormData>
  ) => void;
  onDeleteAllocation: (id: string) => void;
  isLoading?: boolean;
}

export function CategoryAllocation({
  allocations,
  totalBudget,
  onCreateAllocation,
  onUpdateAllocation,
  onDeleteAllocation,
  isLoading = false,
}: CategoryAllocationProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [
    editingAllocation,
    setEditingAllocation,
  ] = useState<BudgetAllocation | null>(null);

  const [formData, setFormData] = useState<BudgetAllocationFormData>({
    category_id: '',
    budgeted_amount: 0,
    tag_allocations: [],
    quarterly_breakdown: [],
    notes: '',
  });

  const [selectedTags, setSelectedTags] = useState<
    Record<string, { selected: boolean; amount: number }>
  >({});

  // Calculate allocation statistics
  const allocationStats = useMemo(() => {
    const totalAllocated = allocations.reduce(
      (sum, allocation) => sum + allocation.budgeted_amount,
      0
    );
    const totalSpent = allocations.reduce(
      (sum, allocation) => sum + allocation.spent_amount,
      0
    );
    const totalRemaining = allocations.reduce(
      (sum, allocation) => sum + allocation.remaining_amount,
      0
    );
    const averageProgress =
      allocations.length > 0
        ? allocations.reduce(
            (sum, allocation) => sum + allocation.percentage_used,
            0
          ) / allocations.length
        : 0;

    return {
      totalAllocated,
      totalSpent,
      totalRemaining,
      averageProgress,
      unallocated: totalBudget - totalAllocated,
      allocationPercentage:
        totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0,
    };
  }, [allocations, totalBudget]);

  const resetForm = () => {
    setFormData({
      category_id: '',
      budgeted_amount: 0,
      tag_allocations: [],
      quarterly_breakdown: [],
      notes: '',
    });
    setSelectedTags({});
  };

  const handleCreateAllocation = () => {
    const tagAllocations = Object.entries(selectedTags)
      .filter(([_, data]) => data.selected && data.amount > 0)
      .map(([tagKey, data]) => {
        const [categoryKey, itemIndex] = tagKey.split('.');
        const category = defaultTagCategories[categoryKey];
        const item = category?.items[parseInt(itemIndex)];
        return {
          tag_category: categoryKey,
          tag_item: item?.label || `Item ${itemIndex}`,
          allocated_amount: data.amount,
          spent_amount: 0,
          remaining_amount: data.amount,
          percentage_used: 0,
        };
      });

    const allocationData = {
      ...formData,
      tag_allocations: tagAllocations,
    };

    onCreateAllocation(allocationData);
    setShowCreateDialog(false);
    resetForm();
  };

  const handleEditAllocation = (allocation: BudgetAllocation) => {
    setEditingAllocation(allocation);
    setFormData({
      category_id: allocation.category_id,
      budgeted_amount: allocation.budgeted_amount,
      tag_allocations: allocation.tag_allocations || [],
      quarterly_breakdown: [],
      notes: allocation.notes || '',
    });

    // Set selected tags based on existing allocations
    const tagState: Record<string, { selected: boolean; amount: number }> = {};
    allocation.tag_allocations?.forEach((tagAlloc) => {
      const tagKey = `${tagAlloc.tag_category}.${tagAlloc.tag_item}`;
      tagState[tagKey] = {
        selected: true,
        amount: tagAlloc.allocated_amount,
      };
    });
    setSelectedTags(tagState);
    setShowEditDialog(true);
  };

  const handleUpdateAllocation = () => {
    if (!editingAllocation) return;

    const tagAllocations = Object.entries(selectedTags)
      .filter(([_, data]) => data.selected && data.amount > 0)
      .map(([tagKey, data]) => {
        const [categoryKey, itemIndex] = tagKey.split('.');
        const category = defaultTagCategories[categoryKey];
        const item = category?.items[parseInt(itemIndex)];
        return {
          tag_category: categoryKey,
          tag_item: item?.label || `Item ${itemIndex}`,
          allocated_amount: data.amount,
          spent_amount: 0,
          remaining_amount: data.amount,
          percentage_used: 0,
        };
      });

    const allocationData = {
      ...formData,
      tag_allocations: tagAllocations,
    };

    onUpdateAllocation(editingAllocation.id, allocationData);
    setShowEditDialog(false);
    setEditingAllocation(null);
    resetForm();
  };

  const handleTagSelection = (
    tagKey: string,
    selected: boolean,
    amount: number = 0
  ) => {
    setSelectedTags((prev) => ({
      ...prev,
      [tagKey]: { selected, amount },
    }));
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-orange-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusBadgeVariant = (percentage: number) => {
    if (percentage >= 90) return 'destructive';
    if (percentage >= 75) return 'secondary';
    return 'default';
  };

  return (
    <div className="space-y-6">
      {/* Allocation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Allocated
                </p>
                <p className="text-2xl font-bold">
                  GHS{allocationStats.totalAllocated.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2">
              <Progress
                value={allocationStats.allocationPercentage}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {allocationStats.allocationPercentage.toFixed(1)}% of total
                budget
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Spent
                </p>
                <p className="text-2xl font-bold">
                  GHS{allocationStats.totalSpent.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                {allocationStats.totalAllocated > 0
                  ? (
                      (allocationStats.totalSpent /
                        allocationStats.totalAllocated) *
                      100
                    ).toFixed(1)
                  : 0}
                % of allocated
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Remaining
                </p>
                <p className="text-2xl font-bold">
                  GHS{allocationStats.totalRemaining.toLocaleString()}
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                Available for spending
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Unallocated
                </p>
                <p className="text-2xl font-bold">
                  GHS{allocationStats.unallocated.toLocaleString()}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                Available to allocate
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Allocations List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Budget Allocations</CardTitle>
              <CardDescription>
                Manage budget allocations by category and ministry tags
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Allocation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {allocations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No allocations yet</p>
              <p>Start by creating your first budget allocation</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allocations.map((allocation) => (
                <Card
                  key={allocation.id}
                  className="border-l-4 border-l-blue-500"
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-lg">
                            {allocation.category_name}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={getStatusBadgeVariant(
                                allocation.percentage_used
                              )}
                            >
                              {allocation.percentage_used}% used
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAllocation(allocation)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteAllocation(allocation.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {allocation.notes && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {allocation.notes}
                          </p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Budgeted:
                            </span>
                            <div className="font-medium">
                              GHS{allocation.budgeted_amount.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Spent:
                            </span>
                            <div className="font-medium">
                              GHS{allocation.spent_amount.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Remaining:
                            </span>
                            <div className="font-medium">
                              GHS{allocation.remaining_amount.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Progress:
                            </span>
                            <div
                              className={`font-medium ${getStatusColor(
                                allocation.percentage_used
                              )}`}
                            >
                              {allocation.percentage_used}%
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="w-full lg:w-64">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{allocation.percentage_used}%</span>
                        </div>
                        <Progress
                          value={allocation.percentage_used}
                          className="h-2"
                        />
                      </div>
                    </div>

                    {/* Tag Allocations */}
                    {allocation.tag_allocations &&
                      allocation.tag_allocations.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h5 className="font-medium mb-2 flex items-center gap-2">
                            <Tags className="h-4 w-4" />
                            Ministry Tag Allocations
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {allocation.tag_allocations.map(
                              (tagAllocation, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between items-center p-2 bg-muted rounded"
                                >
                                  <span className="text-sm font-medium">
                                    {tagAllocation.tag_item}
                                  </span>
                                  <div className="text-sm">
                                    <span className="font-medium">
                                      GHS
                                      {tagAllocation.allocated_amount.toLocaleString()}
                                    </span>
                                    <span className="text-muted-foreground ml-2">
                                      ({tagAllocation.percentage_used}%)
                                    </span>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Allocation Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Budget Allocation</DialogTitle>
            <DialogDescription>
              Allocate budget to categories and ministry tags
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worship">Worship Ministry</SelectItem>
                    <SelectItem value="youth">Youth Ministry</SelectItem>
                    <SelectItem value="children">
                      Children's Ministry
                    </SelectItem>
                    <SelectItem value="outreach">Outreach Ministry</SelectItem>
                    <SelectItem value="administration">
                      Administration
                    </SelectItem>
                    <SelectItem value="facilities">
                      Facilities & Maintenance
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Budgeted Amount (GHS)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.budgeted_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      budgeted_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label>Tag-Based Budget Allocation</Label>
              <div className="mt-2 space-y-4 max-h-80 overflow-y-auto">
                {Object.entries(defaultTagCategories).map(
                  ([categoryKey, category]) => (
                    <div key={categoryKey} className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                        {category.name}
                      </h4>
                      <div className="space-y-2 pl-4">
                        {category.items.map((item, itemIndex) => {
                          const tagKey = `${categoryKey}.${itemIndex}`;
                          const tagData = selectedTags[tagKey] || {
                            selected: false,
                            amount: 0,
                          };

                          return (
                            <div
                              key={itemIndex}
                              className="flex items-center justify-between p-3 border rounded"
                            >
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  checked={tagData.selected}
                                  onCheckedChange={(checked) =>
                                    handleTagSelection(
                                      tagKey,
                                      checked as boolean,
                                      tagData.amount
                                    )
                                  }
                                />
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <div>
                                    <div className="font-medium">
                                      {item.label}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {item.description}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <Input
                                type="number"
                                placeholder="Amount"
                                className="w-32"
                                value={tagData.amount || ''}
                                onChange={(e) =>
                                  handleTagSelection(
                                    tagKey,
                                    tagData.selected,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                disabled={!tagData.selected}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Optional notes for this allocation"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateAllocation} disabled={isLoading}>
                Create Allocation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Allocation Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Budget Allocation</DialogTitle>
            <DialogDescription>
              Update budget allocation details and ministry tags
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worship">Worship Ministry</SelectItem>
                    <SelectItem value="youth">Youth Ministry</SelectItem>
                    <SelectItem value="children">
                      Children's Ministry
                    </SelectItem>
                    <SelectItem value="outreach">Outreach Ministry</SelectItem>
                    <SelectItem value="administration">
                      Administration
                    </SelectItem>
                    <SelectItem value="facilities">
                      Facilities & Maintenance
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-amount">Budgeted Amount (GHS)</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  value={formData.budgeted_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      budgeted_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label>Tag-Based Budget Allocation</Label>
              <div className="mt-2 space-y-4 max-h-80 overflow-y-auto">
                {Object.entries(defaultTagCategories).map(
                  ([categoryKey, category]) => (
                    <div key={categoryKey} className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                        {category.name}
                      </h4>
                      <div className="space-y-2 pl-4">
                        {category.items.map((item, itemIndex) => {
                          const tagKey = `${categoryKey}.${itemIndex}`;
                          const tagData = selectedTags[tagKey] || {
                            selected: false,
                            amount: 0,
                          };

                          return (
                            <div
                              key={itemIndex}
                              className="flex items-center justify-between p-3 border rounded"
                            >
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  checked={tagData.selected}
                                  onCheckedChange={(checked) =>
                                    handleTagSelection(
                                      tagKey,
                                      checked as boolean,
                                      tagData.amount
                                    )
                                  }
                                />
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <div>
                                    <div className="font-medium">
                                      {item.label}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {item.description}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <Input
                                type="number"
                                placeholder="Amount"
                                className="w-32"
                                value={tagData.amount || ''}
                                onChange={(e) =>
                                  handleTagSelection(
                                    tagKey,
                                    tagData.selected,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                disabled={!tagData.selected}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Optional notes for this allocation"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateAllocation} disabled={isLoading}>
                Update Allocation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}