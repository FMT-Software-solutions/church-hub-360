import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { FinanceFilter, IncomeType } from '@/types/finance';
import type { AmountComparison } from '@/utils/finance/search';

// --- Types ---

export interface StatsQueryParams {
  search?: string;
  filters?: FinanceFilter;
  income_type?: IncomeType;
  income_types?: IncomeType[];
  amount_comparison?: AmountComparison | null;
}

export interface IncomeStatsResult {
  total_income: number;
  record_count: number;
  average_income: number;
  top_occasion: string;
  top_occasion_amount: number;
}

export interface ExpenseStatsResult {
  total_expenses: number;
  record_count: number;
  average_expense: number;
  top_purpose: string;
  top_purpose_amount: number;
}

export interface ContributionStatsResult {
  totalAmount: number;
  totalContributionAmount: number;
  totalDonationAmount: number;
  recordCount: number;
  averageAmount: number;
  topContributor: string;
  topContributorAmount: number;
}

export interface PledgeStatsResult {
  totalPledges: number;
  recordCount: number;
  fulfilledAmount: number;
  pendingAmount: number;
  fulfillmentRate: number;
}

// --- Helpers ---

// --- Hooks ---

export function useIncomeStatsData(params: StatsQueryParams) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['income', 'stats_rpc', currentOrganization?.id, params],
    queryFn: async (): Promise<IncomeStatsResult> => {
      if (!currentOrganization?.id) throw new Error('Organization ID required');

      const filters = {
        ...params.filters,
        income_type: params.income_type,
        income_types: params.income_types,
      };

      const { data, error } = await supabase.rpc('get_income_stats', {
        p_organization_id: currentOrganization.id,
        p_filters: filters,
        p_search_text: params.search || '',
      });

      if (error) throw error;
      return data as IncomeStatsResult;
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useExpenseStatsData(params: StatsQueryParams) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['expenses', 'stats_rpc', currentOrganization?.id, params],
    queryFn: async (): Promise<ExpenseStatsResult> => {
      if (!currentOrganization?.id) throw new Error('Organization ID required');

      const filters = {
        ...params.filters,
      };

      const { data, error } = await supabase.rpc('get_expense_stats', {
        p_organization_id: currentOrganization.id,
        p_filters: filters,
        p_search_text: params.search || '',
      });

      if (error) throw error;
      return data as ExpenseStatsResult;
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useContributionStatsData(params: StatsQueryParams) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['contributions', 'stats_rpc', currentOrganization?.id, params],
    queryFn: async (): Promise<ContributionStatsResult> => {
      if (!currentOrganization?.id) throw new Error('Organization ID required');

      const filters = {
        ...params.filters,
        income_type: params.income_type,
        income_types: params.income_types,
      };

      const { data, error } = await supabase.rpc('get_contribution_stats', {
        p_organization_id: currentOrganization.id,
        p_filters: filters,
        p_search_text: params.search || '',
      });

      if (error) throw error;
      return data as ContributionStatsResult;
    },
    enabled: !!currentOrganization?.id,
  });
}

export function usePledgeStatsData(params: StatsQueryParams) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['pledges', 'stats_rpc', currentOrganization?.id, params],
    queryFn: async (): Promise<PledgeStatsResult> => {
      if (!currentOrganization?.id) throw new Error('Organization ID required');

      const filters = {
        ...params.filters,
      };

      const { data, error } = await supabase.rpc('get_pledge_stats', {
        p_organization_id: currentOrganization.id,
        p_filters: filters,
        p_search_text: params.search || '',
      });

      if (error) throw error;
      return data as PledgeStatsResult;
    },
    enabled: !!currentOrganization?.id,
  });
}
