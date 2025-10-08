import { useAuth } from '../contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Users,
  Calendar,
  DollarSign,
  Building2,
  UserPlus,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  MessageSquare,
  BarChart3,
  Tags,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock data for church statistics
  const stats = [
    {
      title: 'Total Members',
      value: '1,247',
      description: 'Active church members',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      subStats: [
        { label: 'New this month', value: '23', icon: UserPlus, trend: 'up' },
      ],
    },
    {
      title: 'Attendance Recorded',
      value: '892',
      description: "This month's attendance",
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      subStats: [
        {
          label: 'Average weekly',
          value: '223',
          icon: TrendingUp,
          trend: 'up',
        },
      ],
    },
    {
      title: 'Finances',
      value: 'GHS45,230',
      description: "This month's summary",
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      subStats: [
        { label: 'Income', value: 'GHS52,100', icon: TrendingUp, trend: 'up' },
        {
          label: 'Expenses',
          value: 'GHS6,870',
          icon: TrendingDown,
          trend: 'down',
        },
      ],
    },
    {
      title: 'Total Branches',
      value: '8',
      description: 'Active church branches',
      icon: Building2,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      subStats: [
        { label: 'Main campus', value: '1', icon: Building2, trend: 'neutral' },
      ],
    },
  ];

  const quickActions = [
    {
      title: 'Mark Attendance',
      description: 'Record service attendance',
      path: '/people/attendance',
      icon: CheckCircle,
    },
    {
      title: 'View Membership List',
      description: 'Manage church members',
      path: '/people/membership',
      icon: Users,
    },
    {
      title: 'Configure Tags',
      description: 'Organize member categories',
      path: '/people/tags',
      icon: Tags,
    },
    {
      title: 'Record Income',
      description: 'Add financial transactions',
      path: '/finance/income',
      icon: DollarSign,
    },
    {
      title: 'Send a Message',
      description: 'Communicate with members',
      path: '/communication',
      icon: MessageSquare,
    },
    {
      title: 'Reports and Insights',
      description: 'View analytics and reports',
      path: '/reports',
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user?.profile?.first_name || 'User'}! Here's your
          overview.
        </p>
      </div>

      <div className="flex gap-6 justify-end bg-neutral-100 dark:bg-neutral-800/50 px-4 py-2 rounded-md border mb-3">
        <div className="flex gap-8 items-center border border-dashed px-2 py-1 rounded-sm bg-background">
          <p className="text-sm text-muted-foreground">Upcoming Events</p>
          <p className="text-sm text-foreground font-black">12</p>
        </div>

        <div className="flex gap-8 items-center border border-dashed px-2 py-1 rounded-sm bg-background">
          <p className="text-sm text-muted-foreground">Birthdays this month</p>
          <p className="text-sm text-foreground font-black">12</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="relative">
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

                {/* Sub-statistics */}
                {stat.subStats && stat.subStats.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {stat.subStats.map((subStat, index) => {
                      const SubIcon = subStat.icon;
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center space-x-1">
                            <SubIcon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {subStat.label}
                            </span>
                          </div>
                          <span
                            className={`font-medium ${
                              subStat.trend === 'up'
                                ? 'text-green-600'
                                : subStat.trend === 'down'
                                ? 'text-red-600'
                                : 'text-foreground'
                            }`}
                          >
                            {subStat.value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest actions in your church management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    New member registered: Sarah Johnson
                  </p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Sunday service attendance recorded: 245 members
                  </p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Monthly tithe collection: GHS12,450
                  </p>
                  <p className="text-xs text-muted-foreground">3 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Youth ministry event scheduled
                  </p>
                  <p className="text-xs text-muted-foreground">5 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common church management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action) => {
                const ActionIcon = action.icon;
                return (
                  <Button
                    key={action.title}
                    variant="outline"
                    className="w-full justify-start h-auto p-3"
                    onClick={() => navigate(action.path)}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <div className="p-2 rounded-lg bg-muted">
                        <ActionIcon className="h-4 w-4" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-medium text-sm">
                          {action.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {action.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
