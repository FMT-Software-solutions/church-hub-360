import {
  Activity,
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  PieChart,
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
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type {
  BudgetAlert,
  BudgetProgress,
  CategoryProgress,
  MonthlyProgress,
  TagProgress,
} from '@/types/finance';

interface ProgressTrackingProps {
  budgetProgress: BudgetProgress;
  categoryProgress: CategoryProgress[];
  tagProgress: TagProgress[];
  monthlyProgress: MonthlyProgress[];
  alerts: BudgetAlert[];
  isLoading?: boolean;
}
export function ProgressTracking({
  budgetProgress,
  categoryProgress,
  tagProgress,
  monthlyProgress,
  alerts,
}: ProgressTrackingProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedView, setSelectedView] = useState('overview');

  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    const totalBudget = categoryProgress.reduce(
      (sum, cat) => sum + cat.budgeted_amount,
      0
    );
    const totalSpent = categoryProgress.reduce(
      (sum, cat) => sum + cat.actual_amount,
      0
    );
    const totalRemaining = totalBudget - totalSpent;
    const overallProgress = budgetProgress.overall_progress;

    const onTrackCategories = categoryProgress.filter(
      (cat) => cat.percentage_used <= 100
    ).length;
    const overBudgetCategories = categoryProgress.filter(
      (cat) => cat.percentage_used > 100
    ).length;
    const criticalAlerts = alerts.filter((alert) => alert.type === 'critical')
      .length;

    const projectedSpend =
      monthlyProgress.length > 0
        ? monthlyProgress[monthlyProgress.length - 1].actual_expenses
        : totalSpent;

    const variance = totalBudget - projectedSpend;
    const variancePercentage =
      totalBudget > 0 ? (variance / totalBudget) * 100 : 0;

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      overallProgress,
      onTrackCategories,
      overBudgetCategories,
      criticalAlerts,
      projectedSpend,
      variance,
      variancePercentage,
    };
  }, [budgetProgress, categoryProgress, alerts, monthlyProgress]);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 90) return 'bg-orange-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getVarianceColor = (variance: number) => {
    if (variance < 0) return 'text-red-600';
    if (variance > 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertBadgeVariant = (type: string) => {
    switch (type) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Overall Progress
                </p>
                <p className="text-2xl font-bold">
                  {keyMetrics.overallProgress.toFixed(1)}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2">
              <Progress value={keyMetrics.overallProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                GHS{keyMetrics.totalSpent.toLocaleString()} of GHS
                {keyMetrics.totalBudget.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Budget Variance
                </p>
                <p
                  className={`text-2xl font-bold ${getVarianceColor(
                    keyMetrics.variance
                  )}`}
                >
                  {keyMetrics.variance >= 0 ? '+' : ''}GHS
                  {keyMetrics.variance.toLocaleString()}
                </p>
              </div>
              {keyMetrics.variance >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600" />
              )}
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                {keyMetrics.variancePercentage >= 0 ? '+' : ''}
                {keyMetrics.variancePercentage.toFixed(1)}% vs budget
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Categories On Track
                </p>
                <p className="text-2xl font-bold">
                  {keyMetrics.onTrackCategories}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                {keyMetrics.overBudgetCategories} over budget
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Critical Alerts
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {keyMetrics.criticalAlerts}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                {alerts.length} total alerts
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Tracking Tabs */}
      <Tabs
        value={selectedView}
        onValueChange={setSelectedView}
        className="w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="tags">Ministry Tags</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Period</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Budget Summary Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Budget Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryProgress.slice(0, 5).map((category) => (
                    <div
                      key={category.category_id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${getProgressColor(
                            category.percentage_used
                          )}`}
                        />
                        <span className="font-medium">
                          {category.category_name}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          GHS{category.budgeted_amount.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {category.percentage_used.toFixed(1)}% used
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Monthly Spending Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyProgress.slice(-6).map((month) => (
                    <div
                      key={`${month.month}-${month.year}`}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {month.month}/{month.year}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          GHS{month.actual_expenses.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          vs GHS{month.budgeted_expenses.toLocaleString()}{' '}
                          budgeted
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Progress</CardTitle>
              <CardDescription>
                Track budget progress across different ministry categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Budgeted</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Progress</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryProgress.map((category) => (
                    <TableRow key={category.category_id}>
                      <TableCell className="font-medium">
                        {category.category_name}
                      </TableCell>
                      <TableCell className="text-right">
                        GHS{category.budgeted_amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        GHS{category.actual_amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        GHS
                        {(
                          category.budgeted_amount - category.actual_amount
                        ).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={Math.min(category.percentage_used, 100)}
                            className="w-16 h-2"
                          />
                          <span className="text-sm font-medium">
                            {category.percentage_used.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            category.percentage_used > 100
                              ? 'destructive'
                              : category.percentage_used > 90
                              ? 'secondary'
                              : 'default'
                          }
                        >
                          {category.percentage_used > 100
                            ? 'Over Budget'
                            : category.percentage_used > 90
                            ? 'Near Limit'
                            : 'On Track'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ministry Tag Progress</CardTitle>
              <CardDescription>
                Monitor budget allocation and spending by ministry tags
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tagProgress.map((tag) => (
                  <Card
                    key={`${tag.tag_category}-${tag.tag_item}`}
                    className="border-l-4 border-l-blue-500"
                  >
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{tag.tag_item}</h4>
                          <p className="text-sm text-muted-foreground capitalize">
                            {tag.tag_category}
                          </p>
                        </div>
                        <Badge
                          variant={
                            tag.percentage_used > 100
                              ? 'destructive'
                              : tag.percentage_used > 90
                              ? 'secondary'
                              : 'default'
                          }
                        >
                          {tag.percentage_used.toFixed(1)}%
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Allocated:</span>
                          <span className="font-medium">
                            GHS{tag.budgeted_amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Spent:</span>
                          <span className="font-medium">
                            GHS{tag.actual_amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Remaining:</span>
                          <span className="font-medium">
                            GHS
                            {(
                              tag.budgeted_amount - tag.actual_amount
                            ).toLocaleString()}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(tag.percentage_used, 100)}
                          className="h-2 mt-2"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Progress Timeline</CardTitle>
              <CardDescription>
                Track budget performance over time with projections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Budgeted</TableHead>
                    <TableHead className="text-right">Actual Spent</TableHead>
                    <TableHead className="text-right">Projected</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyProgress.map((month) => {
                    const variance =
                      month.actual_expenses - month.budgeted_expenses;
                    const variancePercentage =
                      month.budgeted_expenses > 0
                        ? (variance / month.budgeted_expenses) * 100
                        : 0;

                    return (
                      <TableRow key={`${month.month}-${month.year}`}>
                        <TableCell className="font-medium">
                          {month.month}/{month.year}
                        </TableCell>
                        <TableCell className="text-right">
                          GHS{month.budgeted_expenses.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          GHS{month.actual_expenses.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          GHS{month.net_actual.toLocaleString()}
                        </TableCell>
                        <TableCell
                          className={`text-right ${getVarianceColor(variance)}`}
                        >
                          {variance >= 0 ? '+' : ''}GHS
                          {variance.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {variance >= 0 ? (
                              <TrendingUp className="h-4 w-4 text-red-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-green-500" />
                            )}
                            <span className="text-sm">
                              {Math.abs(variancePercentage).toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Alerts & Notifications</CardTitle>
              <CardDescription>
                Monitor budget alerts and take corrective actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No active alerts</p>
                  <p>Your budget is on track with no critical issues</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <Card
                      key={alert.id}
                      className="border-l-4 border-l-orange-500"
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {getAlertIcon(alert.type)}
                            <div>
                              <h4 className="font-semibold">
                                {alert.category}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {alert.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge
                                  variant={getAlertBadgeVariant(alert.type)}
                                >
                                  {alert.type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {alert.category}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {new Date(
                                    alert.created_at
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Resolve
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}