import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/utils/supabase'

function monthRange(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  const s = start.toISOString().slice(0, 10)
  const e = end.toISOString().slice(0, 10)
  return { s, e }
}

export function FinancesCard() {
  const { currentOrganization } = useOrganization()
  const orgId = currentOrganization?.id
  const { s, e } = monthRange(new Date())

  const { data: incomeRows = [] } = useQuery({
    queryKey: ['dashboard-income-month', orgId, s, e],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('income')
        .select('amount,income_type')
        .eq('organization_id', orgId!)
        .eq('is_deleted', false)
        .gte('date', s)
        .lte('date', e)
      if (error) throw error
      return data || []
    },
    staleTime: 60 * 1000,
  })

  const { data: expenseRows = [] } = useQuery({
    queryKey: ['dashboard-expense-month', orgId, s, e],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('amount')
        .eq('organization_id', orgId!)
        .eq('is_deleted', false)
        .gte('date', s)
        .lte('date', e)
      if (error) throw error
      return data || []
    },
    staleTime: 60 * 1000,
  })

  const totals = incomeRows.reduce(
    (acc: Record<string, number>, r: any) => {
      const t = r.income_type as string
      acc[t] = (acc[t] || 0) + (r.amount || 0)
      return acc
    },
    {}
  )
  const generalIncome = totals['general_income'] || 0
  const donations = totals['donation'] || 0
  const pledgePayments = totals['pledge_payment'] || 0
  const contributions = totals['contribution'] || 0
  const expenditure = (expenseRows as any[]).reduce((sum, r: any) => sum + (r.amount || 0), 0)
  const profit = generalIncome + donations + pledgePayments + contributions - expenditure

  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="text-sm text-muted-foreground">Finances</CardTitle>
        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
          <DollarSign className="h-4 w-4 text-purple-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold">{profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        <CardDescription>This month’s Summary</CardDescription>
        <div className="mt-3 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">General Income</span>
            </div>
            <span className="font-medium">{generalIncome.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Donations</span>
            </div>
            <span className="font-medium">{donations.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Pledge Payments</span>
            </div>
            <span className="font-medium">{pledgePayments.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Contributions</span>
            </div>
            <span className="font-medium">{contributions.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <TrendingDown className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Expenditure</span>
            </div>
            <span className="font-medium">{expenditure.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}