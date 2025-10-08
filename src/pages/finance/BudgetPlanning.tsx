import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Copy,
  DollarSign,
  Edit,
  Eye,
  Plus,
  Target,
  Trash2,
  TrendingDown,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import { FinanceDataTable } from '@/components/finance/FinanceDataTable';

import { defaultTagCategories } from '@/utils/defaultTagsData';

import type {
  BudgetAllocation,
  BudgetAllocationFormData,
  BudgetPlan,
  BudgetPlanFormData,
  BudgetProgress,
  BudgetStatus,
} from '@/types/finance';

// Mock data for budget plans
const mockBudgetPlans: BudgetPlan[] = [
  {
    id: '1',
    organization_id: 'org1',
    branch_id: 'branch1',
    name: '2024 Annual Budget',
    fiscal_year: 2024,
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    status: 'active',
    total_income_budget: 500000,
    total_expense_budget: 480000,
    created_by: 'user1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    organization_id: 'org1',
    branch_id: 'branch1',
    name: '2025 Draft Budget',
    fiscal_year: 2025,
    start_date: '2025-01-01',
    end_date: '2025-12-31',
    status: 'draft',
    total_income_budget: 550000,
    total_expense_budget: 520000,
    created_by: 'user1',
    created_at: '2024-11-01T00:00:00Z',
    updated_at: '2024-11-01T00:00:00Z',
  },
];

// Mock data for budget allocations
const mockBudgetAllocations: BudgetAllocation[] = [
  {
    id: '1',
    budget_plan_id: '1',
    category_id: 'cat1',
    category_name: 'Worship Ministry',
    category_type: 'expense',
    budgeted_amount: 50000,
    allocated_amount: 45000,
    spent_amount: 32000,
    remaining_amount: 18000,
    percentage_used: 64,
    tag_allocations: [
      {
        id: 'tag1',
        budget_allocation_id: '1',
        tag_category: 'ministries',
        tag_item: 'Worship Ministry',
        allocated_amount: 30000,
        spent_amount: 20000,
        remaining_amount: 10000,
        percentage_used: 67,
      },
    ],
    notes: 'Includes sound equipment and music licensing',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    budget_plan_id: '1',
    category_id: 'cat2',
    category_name: 'Youth Ministry',
    category_type: 'expense',
    budgeted_amount: 35000,
    allocated_amount: 35000,
    spent_amount: 28000,
    remaining_amount: 7000,
    percentage_used: 80,
    tag_allocations: [
      {
        id: 'tag2',
        budget_allocation_id: '2',
        tag_category: 'ministries',
        tag_item: 'Youth Ministry',
        allocated_amount: 35000,
        spent_amount: 28000,
        remaining_amount: 7000,
        percentage_used: 80,
      },
    ],
    notes: 'Events, camps, and activities for youth',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// Mock budget progress data
const mockBudgetProgress: BudgetProgress = {
  budget_plan_id: '1',
  overall_progress: 72,
  income_progress: 68,
  expense_progress: 75,
  categories: [
    {
      category_id: 'cat1',
      category_name: 'Worship Ministry',
      category_type: 'expense',
      budgeted_amount: 50000,
      actual_amount: 32000,
      percentage_used: 64,
      variance: -18000,
      status: 'on_track',
    },
    {
      category_id: 'cat2',
      category_name: 'Youth Ministry',
      category_type: 'expense',
      budgeted_amount: 35000,
      actual_amount: 28000,
      percentage_used: 80,
      variance: -7000,
      status: 'over_budget',
    },
  ],
  tag_progress: [
    {
      tag_category: 'ministries',
      tag_item: 'Worship Ministry',
      budgeted_amount: 30000,
      actual_amount: 20000,
      percentage_used: 67,
      status: 'on_track',
    },
    {
      tag_category: 'ministries',
      tag_item: 'Youth Ministry',
      budgeted_amount: 35000,
      actual_amount: 28000,
      percentage_used: 80,
      status: 'over_budget',
    },
  ],
  monthly_progress: [],
  alerts: [
    {
      id: 'alert1',
      type: 'warning',
      category: 'Youth Ministry',
      message:
        'Youth Ministry spending is at 80% of budget with 3 months remaining',
      threshold_percentage: 75,
      current_percentage: 80,
      created_at: '2024-10-01T00:00:00Z',
    },
  ],
};

export default function BudgetPlanning() {
  // State management
  const [selectedBudget, setSelectedBudget] = useState<BudgetPlan | null>(
    mockBudgetPlans[0]
  );
  const [budgetPlans] = useState<BudgetPlan[]>(mockBudgetPlans);
  const [budgetAllocations] = useState<BudgetAllocation[]>(
    mockBudgetAllocations
  );
  const [budgetProgress] = useState<BudgetProgress>(mockBudgetProgress);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterStatus, setFilterStatus] = useState<BudgetStatus | 'all'>('all');
  const [filterYear, setFilterYear] = useState<string>('all');

  // Dialog states
  const [showCreateBudget, setShowCreateBudget] = useState(false);
  const [, setShowEditBudget] = useState(false);
  const [showAllocationDialog, setShowAllocationDialog] = useState(false);
  const [, setShowProgressDialog] = useState(false);

  // Form states
  const [budgetForm, setBudgetForm] = useState<BudgetPlanFormData>({
    name: '',
    fiscal_year: new Date().getFullYear(),
    start_date: '',
    end_date: '',
    description: '',
    template_id: '',
    copy_from_previous: false,
    previous_budget_id: '',
  });

  const [allocationForm, setAllocationForm] = useState<
    BudgetAllocationFormData
  >({
    category_id: '',
    budgeted_amount: 0,
    tag_allocations: [],
    quarterly_breakdown: [],
    notes: '',
  });

  // Filtered budget plans
  const filteredBudgets = useMemo(() => {
    return budgetPlans.filter((budget) => {
      const statusMatch =
        filterStatus === 'all' || budget.status === filterStatus;
      const yearMatch =
        filterYear === 'all' || budget.fiscal_year.toString() === filterYear;
      return statusMatch && yearMatch;
    });
  }, [budgetPlans, filterStatus, filterYear]);

  // Budget statistics
  const budgetStats = useMemo(() => {
    if (!selectedBudget) return [];

    const totalBudget = selectedBudget.total_income_budget;
    const totalExpenses = selectedBudget.total_expense_budget;
    const netBudget = totalBudget - totalExpenses;
    const progressPercentage = budgetProgress.overall_progress;

    return [
      {
        title: 'Total Budget',
        value: `GHS${totalBudget.toLocaleString()}`,
        description: `Fiscal Year ${selectedBudget.fiscal_year}`,
        icon: DollarSign,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        trend: 'up',
        change: '+5.2%',
      },
      {
        title: 'Budget Progress',
        value: `${progressPercentage}%`,
        description: `${Math.round(
          (progressPercentage / 100) * 12
        )} months elapsed`,
        icon: Target,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        trend: 'up',
        change: '+2.1%',
      },
      {
        title: 'Net Budget',
        value: `GHS${netBudget.toLocaleString()}`,
        description: netBudget > 0 ? 'Surplus planned' : 'Deficit planned',
        icon: TrendingUp,
        color: netBudget > 0 ? 'text-green-600' : 'text-red-600',
        bgColor: netBudget > 0 ? 'bg-green-50' : 'bg-red-50',
        trend: netBudget > 0 ? 'up' : 'down',
        change: netBudget > 0 ? '+8.3%' : '-3.2%',
      },
      {
        title: 'Active Alerts',
        value: budgetProgress.alerts.length.toString(),
        description: 'Budget monitoring alerts',
        icon: AlertTriangle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        trend: 'down',
        change: '-1',
      },
    ];
  }, [selectedBudget, budgetProgress]);

  // Table columns for budget plans
  const budgetColumns = [
    {
      key: 'name',
      label: 'Budget Name',
      render: (_: any, budget: BudgetPlan) => (
        <div>
          <div className="font-medium">{budget.name}</div>
          <div className="text-sm text-muted-foreground">
            FY {budget.fiscal_year}
          </div>
        </div>
      ),
    },
    {
      key: 'fiscal_year',
      label: 'Fiscal Year',
      render: (_: any, budget: BudgetPlan) => budget.fiscal_year,
    },
    {
      key: 'period',
      label: 'Period',
      render: (_: any, budget: BudgetPlan) => (
        <div className="text-sm">
          {new Date(budget.start_date).toLocaleDateString()} -{' '}
          {new Date(budget.end_date).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: 'total_budget',
      label: 'Total Budget',
      render: (_: any, budget: BudgetPlan) => (
        <div className="font-medium">
          GHS{budget.total_income_budget.toLocaleString()}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_: any, budget: BudgetPlan) => (
        <Badge variant={getStatusBadgeVariant(budget.status)}>
          {budget.status.replace('_', ' ').toUpperCase()}
        </Badge>
      ),
    },
  ];

  // Table actions for budget plans
  const budgetActions = [
    {
      key: 'view',
      label: 'View Details',
      icon: <Eye className="h-4 w-4" />,
      onClick: (budget: BudgetPlan) => setSelectedBudget(budget),
    },
    {
      key: 'edit',
      label: 'Edit Budget',
      icon: <Edit className="h-4 w-4" />,
      onClick: (budget: BudgetPlan) => {
        setSelectedBudget(budget);
        setShowEditBudget(true);
      },
    },
    {
      key: 'copy',
      label: 'Copy Budget',
      icon: <Copy className="h-4 w-4" />,
      onClick: (budget: BudgetPlan) => {
        setBudgetForm({
          ...budgetForm,
          name: `${budget.name} (Copy)`,
          copy_from_previous: true,
          previous_budget_id: budget.id,
        });
        setShowCreateBudget(true);
      },
    },
    {
      key: 'delete',
      label: 'Delete Budget',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (budget: BudgetPlan) => {
        // Handle delete
        console.log('Delete budget:', budget.id);
      },
      variant: 'destructive' as const,
    },
  ];

  // Remove unused variables and functions
  const handleCreateBudget = () => {
    console.log('Creating budget:', budgetForm);
    setShowCreateBudget(false);
    setBudgetForm({
      name: '',
      fiscal_year: new Date().getFullYear(),
      start_date: '',
      end_date: '',
      description: '',
      template_id: '',
      copy_from_previous: false,
      previous_budget_id: '',
    });
  };

  const handleCreateAllocation = () => {
    console.log('Creating allocation:', allocationForm);
    setShowAllocationDialog(false);
    setAllocationForm({
      category_id: '',
      budgeted_amount: 0,
      tag_allocations: [],
      quarterly_breakdown: [],
      notes: '',
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'on_track':
        return 'default';
      case 'over_budget':
        return 'destructive';
      case 'under_budget':
        return 'secondary';
      case 'exceeded':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Budget Planning
          </h1>
          <p className="text-muted-foreground mt-2">
            Plan, track, and manage church budgets with tag-based allocations
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setShowProgressDialog(true)}>
            <BarChart3 className="h-4 w-4 mr-2" />
            View Progress
          </Button>
          <Button onClick={() => setShowCreateBudget(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Budget
          </Button>
        </div>
      </div>

      {/* Budget Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {budgetStats.map((stat: any) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
                <div className="flex items-center mt-2">
                  {stat.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                  )}
                  <span
                    className={`text-xs ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Budget Plans</CardTitle>
                  <CardDescription>
                    Manage and track all budget plans for your organization
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select
                    value={filterStatus}
                    onValueChange={(value) =>
                      setFilterStatus(value as BudgetStatus | 'all')
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Filter by year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <FinanceDataTable
                data={filteredBudgets}
                columns={budgetColumns}
                actions={budgetActions}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allocations Tab */}
        <TabsContent value="allocations" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Budget Allocations</CardTitle>
                  <CardDescription>
                    {selectedBudget
                      ? `Allocations for ${selectedBudget.name}`
                      : 'Select a budget to view allocations'}
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowAllocationDialog(true)}
                  disabled={!selectedBudget}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Allocation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedBudget ? (
                <div className="space-y-4">
                  {budgetAllocations.map((allocation) => (
                    <Card
                      key={allocation.id}
                      className="border-l-4 border-l-blue-500"
                    >
                      <CardContent className="pt-6">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">
                              {allocation.category_name}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {allocation.notes}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">
                                  Budgeted:
                                </span>
                                <div className="font-medium">
                                  GHS
                                  {allocation.budgeted_amount.toLocaleString()}
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
                                  GHS
                                  {allocation.remaining_amount.toLocaleString()}
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Used:
                                </span>
                                <div className="font-medium">
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
                              <h5 className="font-medium mb-2">
                                Tag Allocations
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {allocation.tag_allocations.map(
                                  (tagAllocation) => (
                                    <div
                                      key={tagAllocation.id}
                                      className="flex justify-between items-center p-2 bg-muted rounded"
                                    >
                                      <span className="text-sm">
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
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Select a budget plan to view its allocations
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Category Progress</CardTitle>
                <CardDescription>Budget progress by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {budgetProgress.categories.map((category) => (
                    <div key={category.category_id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {category.category_name}
                        </span>
                        <Badge variant={getStatusBadgeVariant(category.status)}>
                          {category.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>
                          GHS{category.actual_amount.toLocaleString()} / GHS
                          {category.budgeted_amount.toLocaleString()}
                        </span>
                        <span>{category.percentage_used}%</span>
                      </div>
                      <Progress
                        value={category.percentage_used}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tag Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Ministry Progress</CardTitle>
                <CardDescription>
                  Budget progress by ministry tags
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {budgetProgress.tag_progress.map((tag, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{tag.tag_item}</span>
                        <Badge variant={getStatusBadgeVariant(tag.status)}>
                          {tag.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>
                          GHS{tag.actual_amount.toLocaleString()} / GHS
                          {tag.budgeted_amount.toLocaleString()}
                        </span>
                        <span>{tag.percentage_used}%</span>
                      </div>
                      <Progress value={tag.percentage_used} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Budget Alerts */}
          {budgetProgress.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Budget Alerts
                </CardTitle>
                <CardDescription>
                  Important budget monitoring notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {budgetProgress.alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        alert.type === 'critical'
                          ? 'border-l-red-500 bg-red-50'
                          : alert.type === 'warning'
                          ? 'border-l-orange-500 bg-orange-50'
                          : 'border-l-blue-500 bg-blue-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{alert.category}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {alert.message}
                          </p>
                        </div>
                        <Badge
                          variant={
                            alert.type === 'critical'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {alert.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Budget Health Score</CardTitle>
                <CardDescription>
                  Overall budget performance analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-4xl font-bold text-green-600">85%</div>
                  <div className="text-lg font-medium">Good</div>
                  <p className="text-sm text-muted-foreground">
                    Your budget is performing well with most categories on track
                  </p>
                  <Progress value={85} className="h-3" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>
                  Budget analysis and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Income on Track</p>
                      <p className="text-sm text-muted-foreground">
                        68% of projected income received
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Youth Ministry Alert</p>
                      <p className="text-sm text-muted-foreground">
                        Consider reallocating funds for Q4
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Surplus Projected</p>
                      <p className="text-sm text-muted-foreground">
                        GHS20,000 surplus expected
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Budget Dialog */}
      <Dialog open={showCreateBudget} onOpenChange={setShowCreateBudget}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Budget Plan</DialogTitle>
            <DialogDescription>
              Set up a new budget plan for your organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget-name">Budget Name</Label>
                <Input
                  id="budget-name"
                  value={budgetForm.name}
                  onChange={(e) =>
                    setBudgetForm({ ...budgetForm, name: e.target.value })
                  }
                  placeholder="e.g., 2025 Annual Budget"
                />
              </div>
              <div>
                <Label htmlFor="fiscal-year">Fiscal Year</Label>
                <Input
                  id="fiscal-year"
                  type="number"
                  value={budgetForm.fiscal_year}
                  onChange={(e) =>
                    setBudgetForm({
                      ...budgetForm,
                      fiscal_year: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={budgetForm.start_date}
                  onChange={(e) =>
                    setBudgetForm({ ...budgetForm, start_date: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={budgetForm.end_date}
                  onChange={(e) =>
                    setBudgetForm({ ...budgetForm, end_date: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={budgetForm.description}
                onChange={(e) =>
                  setBudgetForm({ ...budgetForm, description: e.target.value })
                }
                placeholder="Optional description for this budget plan"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="copy-previous"
                checked={budgetForm.copy_from_previous}
                onCheckedChange={(checked) =>
                  setBudgetForm({
                    ...budgetForm,
                    copy_from_previous: checked as boolean,
                  })
                }
              />
              <Label htmlFor="copy-previous">Copy from previous budget</Label>
            </div>
            {budgetForm.copy_from_previous && (
              <div>
                <Label htmlFor="previous-budget">Previous Budget</Label>
                <Select
                  value={budgetForm.previous_budget_id}
                  onValueChange={(value) =>
                    setBudgetForm({ ...budgetForm, previous_budget_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select previous budget" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetPlans.map((budget) => (
                      <SelectItem key={budget.id} value={budget.id}>
                        {budget.name} (FY {budget.fiscal_year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateBudget(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateBudget}>Create Budget</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Allocation Dialog */}
      <Dialog
        open={showAllocationDialog}
        onOpenChange={setShowAllocationDialog}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Budget Allocation</DialogTitle>
            <DialogDescription>
              Allocate budget to categories and ministry tags
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={allocationForm.category_id}
                  onValueChange={(value) =>
                    setAllocationForm({ ...allocationForm, category_id: value })
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
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Budgeted Amount (GHS)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={allocationForm.budgeted_amount}
                  onChange={(e) =>
                    setAllocationForm({
                      ...allocationForm,
                      budgeted_amount: parseFloat(e.target.value),
                    })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label>Ministry Tag Allocation</Label>
              <div className="mt-2 space-y-2">
                {Object.entries(defaultTagCategories.ministries.items).map(
                  ([key, item]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox />
                        <div>
                          <div className="font-medium">
                            {(item as any).label}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {(item as any).description}
                          </div>
                        </div>
                      </div>
                      <Input
                        type="number"
                        placeholder="Amount"
                        className="w-32"
                      />
                    </div>
                  )
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={allocationForm.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setAllocationForm({
                    ...allocationForm,
                    notes: e.target.value,
                  })
                }
                placeholder="Optional notes for this allocation"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAllocationDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateAllocation}>Add Allocation</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
