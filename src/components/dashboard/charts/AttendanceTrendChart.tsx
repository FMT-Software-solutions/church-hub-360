import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/utils/supabase'

function monthBounds(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return { startIso: start.toISOString(), endIso: new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).toISOString() }
}

export function AttendanceTrendChart() {
  const { currentOrganization } = useOrganization()
  const orgId = currentOrganization?.id
  const { startIso, endIso } = monthBounds(new Date())
  const { data: trend = [] } = useQuery({
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">Attendance Trend (This Month)</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}