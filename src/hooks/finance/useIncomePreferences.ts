import { useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { getFinancePreferences, upsertFinancePreferences } from '@/db/expensePrefsDb';

export function useIncomePreferences() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const orgId = currentOrganization?.id || '';
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['finance_preferences', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      return await getFinancePreferences(orgId);
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  const parsed = useMemo(() => {
    try {
      const raw = data?.income_category_prefs || '';
      const obj = raw ? JSON.parse(raw) : null;
      if (obj && Array.isArray(obj.categories)) return obj as { categories: { key: string; label: string }[] };
    } catch {}
    return { categories: [] } as { categories: { key: string; label: string }[] };
  }, [data]);

  const categoryOptions = useMemo(() => parsed.categories.map((c) => c.label), [parsed]);
  const categoryKeys = useMemo(() => parsed.categories.map((c) => c.key), [parsed]);

  const savePrefsMutation = useMutation({
    mutationFn: async (next: any) => {
      if (!orgId || !user?.id) return null;
      const payload = { income_category_prefs: JSON.stringify(next) };
      return await upsertFinancePreferences(orgId, payload, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance_preferences', orgId] });
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (label: string) => {
      if (!orgId || !user?.id || !label.trim()) return null;
      const slug = label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      const exists = parsed.categories.some((c: any) => c.key === slug);
      const next = exists ? parsed : { categories: [...parsed.categories, { key: slug || 'other', label }] };
      const payload = { income_category_prefs: JSON.stringify(next) };
      return await upsertFinancePreferences(orgId, payload, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance_preferences', orgId] });
    },
  });

  const removeCategoryMutation = useMutation({
    mutationFn: async (key: string) => {
      if (!orgId || !user?.id) return null;
      const next = { categories: parsed.categories.filter((c: any) => c.key !== key) } as any;
      const payload = { income_category_prefs: JSON.stringify(next) };
      return await upsertFinancePreferences(orgId, payload, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance_preferences', orgId] });
    },
  });

  const renameCategoryMutation = useMutation({
    mutationFn: async ({ key, label }: { key: string; label: string }) => {
      if (!orgId || !user?.id) return null;
      const next = { categories: parsed.categories.map((c: any) => (c.key === key ? { ...c, label } : c)) } as any;
      const payload = { income_category_prefs: JSON.stringify(next) };
      return await upsertFinancePreferences(orgId, payload, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance_preferences', orgId] });
    },
  });

  const initMutation = useMutation({
    mutationFn: async () => {
      if (!orgId || !user?.id) return null;
      return await upsertFinancePreferences(orgId, {}, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance_preferences', orgId] });
    },
  });

  useEffect(() => {
    if (!!orgId && !!user?.id && (!data || !data.income_category_prefs)) {
      initMutation.mutate();
    }
  }, [orgId, user?.id, data?.income_category_prefs]);

  return {
    prefs: parsed,
    categoryOptions,
    categoryKeys,
    savePreferences: (next: any) => savePrefsMutation.mutate(next),
    addCategory: (label: string) => addCategoryMutation.mutate(label),
    removeCategory: (key: string) => removeCategoryMutation.mutate(key),
    renameCategory: (key: string, label: string) => renameCategoryMutation.mutate({ key, label }),
  };
}
