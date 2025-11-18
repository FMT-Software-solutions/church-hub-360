import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useMemberStatistics } from '@/hooks/useMemberQueries'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/utils/supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts'

function monthBounds(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return { startIso: start.toISOString(), endIso: new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).toISOString(), startDate: start, endDate: end }
}

export function ChartsSection() {
  const { currentOrganization } = useOrganization()
  const orgId = currentOrganization?.id
  const { data: stats } = useMemberStatistics(orgId)
  const { startIso, endIso } = monthBounds(new Date())

  // Attendance trend for current month
  const { data: attendanceTrend = [] } = useQuery({
    queryKey: ['dashboard-trend-attendance', orgId, startIso, endIso],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('marked_at, attendance_sessions!inner(organization_id)')
        .eq('attendance_sessions.organization_id', orgId!)
        .gte('marked_at', startIso)
        .lte('marked_at', endIso)
      if (error) throw error
      const counts: Record<string, number> = {}
      for (const r of (data || [])) {
        const day = (r as any).marked_at.split('T')[0]
        counts[day] = (counts[day] || 0) + 1
      }
      return Object.entries(counts)
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([date, count]) => ({ date, count }))
    },
    staleTime: 60 * 1000,
  })

  // Finance breakdown for current month
  const { data: incomeRows = [] } = useQuery({
    queryKey: ['dashboard-income-month', orgId, startIso, endIso],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('income')
        .select('amount,income_type')
        .eq('organization_id', orgId!)
        .eq('is_deleted', false)
        .gte('date', startIso)
        .lte('date', endIso)
      if (error) throw error
      return data || []
    },
    staleTime: 60 * 1000,
  })

  const financeTotals = (incomeRows as any[]).reduce((acc: Record<string, number>, r: any) => {
    acc[r.income_type] = (acc[r.income_type] || 0) + (r.amount || 0)
    return acc
  }, {})
  const financeData = [
    { name: 'General Income', value: financeTotals['general_income'] || 0 },
    { name: 'Contributions', value: financeTotals['contribution'] || 0 },
    { name: 'Donations', value: financeTotals['donation'] || 0 },
    { name: 'Pledge Payments', value: financeTotals['pledge_payment'] || 0 },
  ]
  const COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b']

  // Members by gender bar chart
  const genderData = stats
    ? Object.entries(stats.members_by_gender).map(([gender, count]) => ({ gender, count }))
    : []

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Attendance Trend (This Month)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Members by Gender</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={genderData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="gender" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Finance Breakdown (This Month)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={financeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {financeData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}