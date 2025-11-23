import { Activity } from 'lucide-react'
import { FinanceDataTable } from '@/components/finance/FinanceDataTable'
import { useActivityLogs } from '@/hooks/finance/activityLogs'
import type { FinanceActionType, FinanceEntityType, DateFilter } from '@/types/finance'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { BranchSelector } from '@/components/shared/BranchSelector'
import { DatePresetPicker, type DatePresetValue } from '@/components/attendance/reports/DatePresetPicker'
import { mapPickerToDateFilter, mapDateFilterToPicker, getPresetLabel } from '@/utils/finance/dateFilter'
import { Button } from '@/components/ui/button'
import React from 'react'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Eye, RefreshCw } from 'lucide-react'
import { paymentMethodOptions } from '@/components/finance/constants'

const ENTITY_TYPES: FinanceEntityType[] = ['income', 'expense', 'pledge_record', 'pledge_payment', 'contribution']
const ACTION_TYPES: FinanceActionType[] = ['create', 'update', 'delete', 'print_receipt']

export function ActivityLogs() {
  const { currentOrganization } = useOrganization()
  const [filters, setFilters] = React.useState<{ date_filter: DateFilter; entity_types?: FinanceEntityType[]; action_types?: FinanceActionType[]; branch_id_filter?: string[] }>({
    date_filter: { type: 'preset', preset: 'this_month' },
  })

  const [sortKey, setSortKey] = React.useState<string>('created_at')
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc')
  const [datePresetValue, setDatePresetValue] = React.useState<DatePresetValue>(mapDateFilterToPicker(filters.date_filter))
  React.useEffect(() => {
    setDatePresetValue(mapDateFilterToPicker(filters.date_filter))
  }, [filters.date_filter])

  const query = useActivityLogs({ page: 1, pageSize: 20, filters })
  const rows = (query.data?.data || []) as any[]
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<any | null>(null)
  const sortedRows = React.useMemo(() => {
    if (!rows?.length) return []
    const copy = [...rows]
    copy.sort((a, b) => {
      const av = (a as any)[sortKey]
      const bv = (b as any)[sortKey]
      if (sortKey.includes('date') || sortKey.includes('created_at')) {
        const ad = new Date(av as any).getTime()
        const bd = new Date(bv as any).getTime()
        return sortDirection === 'asc' ? ad - bd : bd - ad
      }
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDirection === 'asc' ? av - bv : bv - av
      }
      const as = String(av || '')
      const bs = String(bv || '')
      return sortDirection === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as)
    })
    return copy
  }, [rows, sortKey, sortDirection])

  const columns = [
    { key: 'created_at', label: 'Date', sortable: true },
    { key: 'entity_type', label: 'Entity', sortable: true },
    { key: 'action_type', label: 'Action', sortable: true },
    { key: 'amount', label: 'Amount', sortable: true },
    { key: 'payment_method', label: 'Method', sortable: true },
    {
      key: 'actor',
      label: 'Actor',
      sortable: false,
      render: (_: any, rec: any) => {
        const first = rec?.actor?.first_name
        const last = rec?.actor?.last_name
        const name = `${first || ''} ${last || ''}`.trim()
        return name || rec?.actor_id || '-'
      },
    },
    { key: 'entity_id', label: 'Record ID', sortable: true },
  ]

  const onSort = (key: string, dir: 'asc' | 'desc') => {
    setSortKey(key)
    setSortDirection(dir)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Activity Logs</h1>
      </div>

      <div className="border rounded-lg p-4 bg-muted/20 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label>Entity</Label>
            <Select
              value={filters.entity_types?.[0] || 'all'}
              onValueChange={(v) => setFilters((f) => ({ ...f, entity_types: v === 'all' ? undefined : [v as FinanceEntityType] }))}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="All entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entities</SelectItem>
                {ENTITY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Action</Label>
            <Select
              value={filters.action_types?.[0] || 'all'}
              onValueChange={(v) => setFilters((f) => ({ ...f, action_types: v === 'all' ? undefined : [v as FinanceActionType] }))}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {ACTION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Branch</Label>
            <BranchSelector
              variant="single"
              value={filters.branch_id_filter?.[0]}
              onValueChange={(value) => setFilters((f) => ({ ...f, branch_id_filter: value ? [value as string] : undefined }))}
              allowClear
              placeholder="All branches"
            />
          </div>
          <div>
            <DatePresetPicker
              value={datePresetValue}
              onChange={(val: DatePresetValue) => {
                setDatePresetValue(val)
                setFilters((f) => ({ ...f, date_filter: mapPickerToDateFilter(val) }))
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters({ date_filter: { type: 'preset', preset: 'this_month' } })}
          >
            Reset Filters
          </Button>
          <div className="text-xs text-muted-foreground">Date: {getPresetLabel(filters.date_filter.preset)}</div>
        </div>
      </div>

      <FinanceDataTable
        data={sortedRows}
        columns={columns}
        actions={[{
          key: 'view',
          label: 'View Details',
          icon: <Eye className="h-4 w-4" />,
          onClick: (rec: any) => { setSelected(rec); setDetailsOpen(true) },
        }]}
        toolbarExtra={
          <Button variant="outline" size="sm" onClick={() => query.refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        }
        loading={query.isLoading}
        onSort={onSort}
        sortKey={sortKey}
        sortDirection={sortDirection}
        printOrganizationName={currentOrganization?.name}
        printTitle="Finance Activity Logs"
        printDateFilter={filters.date_filter}
      />

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {formatDescription(selected)}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formatDetails(selected).map((item) => (
                  <div key={item.label} className="border rounded p-3">
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                    <div className="text-sm font-medium break-words">{item.value}</div>
                  </div>
                ))}
              </div>
              {formatMetadata(selected).length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Metadata</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formatMetadata(selected).map((item) => (
                      <div key={item.label} className="border rounded p-3">
                        <div className="text-xs text-muted-foreground">{item.label}</div>
                        <div className="text-sm font-medium break-words">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function humanizeUnderscore(value: string) {
  return value.replace(/_/g, ' ').replace(/(^|\s)([a-z])/g, (m) => m.toUpperCase())
}

function formatCurrency(amount?: number) {
  if (amount == null) return '-'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'GHS' }).format(amount)
}

function formatDateTime(value: string) {
  const d = new Date(value)
  return d.toLocaleString()
}

function getPaymentMethodLabel(method?: string) {
  if (!method) return '-'
  const found = paymentMethodOptions.find((m) => m.value === method)
  return found?.label || humanizeUnderscore(method)
}

function formatDescription(rec: any) {
  const first = rec?.actor?.first_name
  const last = rec?.actor?.last_name
  const name = `${first || ''} ${last || ''}`.trim() || rec?.actor_id || 'Unknown user'
  const action = humanizeUnderscore(rec?.action_type || '')
  const entity = humanizeUnderscore(rec?.entity_type || '')
  const date = formatDateTime(rec?.created_at)
  return `${name} ${action.toLowerCase()} ${entity.toLowerCase()} on ${date}`
}

function formatDetails(rec: any) {
  const items = [
    { label: 'Entity', value: humanizeUnderscore(rec?.entity_type || '-') },
    { label: 'Action', value: humanizeUnderscore(rec?.action_type || '-') },
    { label: 'Amount', value: formatCurrency(rec?.amount) },
    { label: 'Method', value: getPaymentMethodLabel(rec?.payment_method) },
    { label: 'Actor', value: `${rec?.actor?.first_name || ''} ${rec?.actor?.last_name || ''}`.trim() || rec?.actor_id || '-' },
    { label: 'Date', value: formatDateTime(rec?.created_at) },
    { label: 'Branch', value: rec?.branch?.name || '-' },
    { label: 'Record ID', value: rec?.entity_id || '-' },
  ]
  return items
}

function isIdKey(key: string) {
  return /(^id$|_id$|^created_by$|^updated_by$|^actor_id$|^organization_id$|^branch_id$|^approved_by$)/i.test(key)
}

function formatMetadata(rec: any) {
  const meta = rec?.metadata
  if (!meta || typeof meta !== 'object') return []
  const entries: { label: string; value: string }[] = []
  const walk = (obj: any, prefix = '') => {
    for (const [k, v] of Object.entries(obj)) {
      if (isIdKey(k)) continue
      const label = humanizeUnderscore(prefix ? `${prefix}_${k}` : k)
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        walk(v, prefix ? `${prefix}_${k}` : k)
      } else {
        entries.push({ label, value: Array.isArray(v) ? v.join(', ') : String(v ?? '-') })
      }
    }
  }
  walk(meta)
  return entries
}
