import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/utils/supabase'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useBranchScope, applyBranchScope } from '@/hooks/useBranchScope'
import type { DateFilter, FinanceActivityLog, FinanceActionType, FinanceEntityType } from '@/types/finance'

export interface ActivityLogsQueryParams {
  page?: number
  pageSize?: number
  search?: string
  filters?: {
    date_filter: DateFilter
    action_types?: FinanceActionType[]
    entity_types?: FinanceEntityType[]
    branch_id_filter?: string[]
  }
}

export interface PaginatedActivityLogsResponse {
  data: (FinanceActivityLog & { actor?: { first_name?: string; last_name?: string } })[]
  totalCount: number
  totalPages: number
  currentPage: number
  pageSize: number
}

export const activityLogKeys = {
  all: ['activity_logs'] as const,
  lists: () => [...activityLogKeys.all, 'list'] as const,
  list: (organizationId: string, params?: ActivityLogsQueryParams) =>
    [...activityLogKeys.lists(), organizationId, params] as const,
}

export function useActivityLogs(params?: ActivityLogsQueryParams) {
  const { currentOrganization } = useOrganization()
  const scope = useBranchScope(currentOrganization?.id)

  const queryParams: Required<Pick<ActivityLogsQueryParams, 'page' | 'pageSize'>> & ActivityLogsQueryParams = {
    page: 1,
    pageSize: 10,
    ...params,
  }

  return useQuery({
    queryKey: [
      ...activityLogKeys.list(currentOrganization?.id || '', queryParams),
      'branchScope',
      scope.isScoped ? scope.branchIds : 'all',
    ],
    queryFn: async (): Promise<PaginatedActivityLogsResponse> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required')

      let query = supabase
        .from('finance_activity_logs')
        .select('*, actor:profiles(id, first_name, last_name), branch:branches(id, name)', { count: 'exact' })
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })

      if (queryParams.search && queryParams.search.trim()) {
        const q = queryParams.search.trim()
        query = query.or(`entity_id.eq.${q},payment_method.ilike.%${q}%`)
      }

      const f = queryParams.filters
      if (f?.action_types?.length) query = query.in('action_type', f.action_types as string[])
      if (f?.entity_types?.length) query = query.in('entity_type', f.entity_types as string[])

      if (f?.date_filter) {
        const df = f.date_filter
        if (df.type === 'preset') {
          const today = new Date()
          if (df.preset === 'this_month') {
            const start = new Date(today.getFullYear(), today.getMonth(), 1)
            const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
            query = query.gte('created_at', start.toISOString())
            query = query.lte('created_at', new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59).toISOString())
          } else if (df.preset === 'last_month') {
            const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
            const end = new Date(today.getFullYear(), today.getMonth(), 0)
            query = query.gte('created_at', start.toISOString())
            query = query.lte('created_at', new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59).toISOString())
          } else if (df.preset === 'this_year') {
            const start = new Date(today.getFullYear(), 0, 1)
            const end = new Date(today.getFullYear(), 11, 31)
            query = query.gte('created_at', start.toISOString())
            query = query.lte('created_at', new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59).toISOString())
          } else if (df.preset === 'last_year') {
            const start = new Date(today.getFullYear() - 1, 0, 1)
            const end = new Date(today.getFullYear() - 1, 11, 31)
            query = query.gte('created_at', start.toISOString())
            query = query.lte('created_at', new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59).toISOString())
          }
        } else if (df.type === 'custom') {
          if (df.start_date) query = query.gte('created_at', new Date(df.start_date).toISOString())
          if (df.end_date) query = query.lte('created_at', new Date(df.end_date).toISOString())
        }
      }

      if (f?.branch_id_filter?.length) {
        const ids = (f.branch_id_filter as string[]).join(',')
        query = query.or(`branch_id.in.(${ids}),branch_id.is.null`)
      }

      {
        const scoped = applyBranchScope(query, scope, 'branch_id', true)
        if (scoped.abortIfEmpty) {
          return {
            data: [],
            totalCount: 0,
            totalPages: 1,
            currentPage: queryParams.page!,
            pageSize: queryParams.pageSize!,
          }
        }
        query = scoped.query
      }

      const from = (queryParams.page! - 1) * queryParams.pageSize!
      const to = from + queryParams.pageSize! - 1
      query = query.range(from, to)

      const { data, error, count } = await query
      if (error) throw error

      const totalCount = count || 0
      const totalPages = Math.ceil(totalCount / queryParams.pageSize!)

      return {
        data: (data || []) as any,
        totalCount,
        totalPages,
        currentPage: queryParams.page!,
        pageSize: queryParams.pageSize!,
      }
    },
    enabled: !!currentOrganization?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
