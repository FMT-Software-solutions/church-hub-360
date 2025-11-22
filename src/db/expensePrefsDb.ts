import { supabase } from '@/utils/supabase';

export interface FinancePreferencesRow {
  id: string;
  organization_id: string;
  expenses_prefs: string | null;
  income_category_prefs: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export async function getFinancePreferences(orgId: string) {
  const { data, error } = await supabase
    .from('finance_preferences')
    .select('*')
    .eq('organization_id', orgId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as FinancePreferencesRow | null;
}

export async function upsertFinancePreferences(
  orgId: string,
  payload: { expenses_prefs?: string; income_category_prefs?: string },
  userId?: string
) {
  const existing = await getFinancePreferences(orgId);
  if (existing) {
    const { data, error } = await supabase
      .from('finance_preferences')
      .update({
        ...(payload.expenses_prefs !== undefined ? { expenses_prefs: payload.expenses_prefs } : {}),
        ...(payload.income_category_prefs !== undefined ? { income_category_prefs: payload.income_category_prefs } : {}),
      })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as FinancePreferencesRow;
  } else {
    const insertPayload: Record<string, any> = {
      organization_id: orgId,
      created_by: userId || null,
    };
    if (payload.expenses_prefs !== undefined) insertPayload.expenses_prefs = payload.expenses_prefs;
    if (payload.income_category_prefs !== undefined) insertPayload.income_category_prefs = payload.income_category_prefs;
    const { data, error } = await supabase
      .from('finance_preferences')
      .insert(insertPayload)
      .select()
      .single();
    if (error) throw error;
    return data as FinancePreferencesRow;
  }
}
