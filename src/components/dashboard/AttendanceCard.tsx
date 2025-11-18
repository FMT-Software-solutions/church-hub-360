import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { CalendarCheck } from 'lucide-react'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/utils/supabase'

function monthBounds(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return { startIso: start.toISOString(), endIso: new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).toISOString() }
}

export function AttendanceCard() {
  const { currentOrganization } = useOrganization()
  const orgId = currentOrganization?.id
  const { startIso, endIso } = monthBounds(new Date())

  const { data: recordedThisMonth = 0 } = useQuery({
    queryKey: ['dashboard-attendance-records', orgId, startIso, endIso],
    enabled: !!orgId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('attendance_records')
        .select('id, attendance_sessions!inner(organization_id)', { count: 'exact', head: true })
        .eq('attendance_sessions.organization_id', orgId!)
        .gte('marked_at', startIso)
        .lte('marked_at', endIso)
      if (error) throw error
      return count || 0
    },
    staleTime: 60 * 1000,
  })

  const { data: upcomingSessions = 0 } = useQuery({
    queryKey: ['dashboard-upcoming-sessions', orgId, startIso, endIso],
    enabled: !!orgId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('attendance_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId!)
        .eq('is_deleted', false)
        .gte('start_time', startIso)
        .lte('start_time', endIso)
        .gt('start_time', new Date().toISOString())
      if (error) throw error
      return count || 0
    },
    staleTime: 60 * 1000,
  })

  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="text-sm text-muted-foreground">Attendance</CardTitle>
        <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/20">
          <CalendarCheck className="h-4 w-4 text-teal-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold">{recordedThisMonth.toLocaleString()}</div>
        <CardDescription>Recorded this month</CardDescription>
        <div className="mt-3 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Upcoming sessions this month</span>
            <span className="font-medium">{upcomingSessions}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}