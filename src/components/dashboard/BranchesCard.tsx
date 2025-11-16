import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Building2 } from 'lucide-react'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useBranches } from '@/hooks/useBranchQueries'

export function BranchesCard() {
  const { currentOrganization } = useOrganization()
  const { data: branches = [] } = useBranches(currentOrganization?.id)
  const total = branches.length
  const active = branches.filter((b) => b.is_active).length
  const inactive = total - active

  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="text-sm text-muted-foreground">Branches</CardTitle>
        <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
          <Building2 className="h-4 w-4 text-orange-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold">{total.toLocaleString()}</div>
        <CardDescription>Total branches</CardDescription>
        <div className="mt-3 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Active</span>
            <span className="font-medium">{active}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Inactive</span>
            <span className="font-medium">{inactive}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}