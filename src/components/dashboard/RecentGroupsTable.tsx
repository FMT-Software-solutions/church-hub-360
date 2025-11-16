import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/utils/supabase'

export function RecentGroupsTable() {
  const { currentOrganization } = useOrganization()
  const orgId = currentOrganization?.id
  const { data: groups = [] } = useQuery({
    queryKey: ['dashboard-recent-groups', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select(`id,name,created_at,created_by`) // creator id
        .eq('organization_id', orgId!)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      const rows = (data || []) as Array<{ id: string; name: string; created_at: string; created_by: string | null }>
      const ids = Array.from(new Set(rows.map(r => r.created_by).filter(Boolean))) as string[]
      let profiles: Record<string, string> = {}
      if (ids.length > 0) {
        const { data: profs, error: pErr } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', ids);
        if (pErr) { throw pErr }
        (profs || []).forEach((p: any) => {
          profiles[p.id] = (p.first_name && p.last_name) ? `${p.first_name} ${p.last_name}` : (p.first_name || p.last_name || '—')
        })
      }
      return rows.map((g) => ({
        id: g.id,
        name: g.name,
        created_at: g.created_at,
        created_by_name: g.created_by ? (profiles[g.created_by] || '—') : '—',
      }))
    },
    staleTime: 60 * 1000,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">Recently Created Groups</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="text-left py-2 pr-4">Name</th>
                <th className="text-left py-2 pr-4">Created By</th>
                <th className="text-left py-2">Created At</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id} className="border-t">
                  <td className="py-2 pr-4">{g.name}</td>
                  <td className="py-2 pr-4">{g.created_by_name}</td>
                  <td className="py-2">{new Date(g.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {groups.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-3 text-muted-foreground">No recent groups</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}