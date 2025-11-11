import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { expensePrefsDb, type ExpensePreferences } from '@/db/expensePrefsDb';
import { useOrganization } from '@/contexts/OrganizationContext';

// Derive readable defaults from ExpenseCategory, plus a few common ones
const DEFAULT_PURPOSES: string[] = [
  'Utilities',
  'Maintenance',
  'Supplies',
  'Equipment',
  'Salaries',
  'Benefits',
  'Ministry Expenses',
  'Outreach',
  'Missions',
  'Events',
  'Transportation',
  'Insurance',
  'Professional Services',
  'Other',
];

export function useExpensePreferences() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  // Read-only live query of preferences
  const prefs = useLiveQuery(async () => {
    if (!orgId) return null;
    return await expensePrefsDb.expensePrefs.get(orgId);
  }, [orgId]);

  // Ensure record exists outside of liveQuery; no writes in liveQuery context
  useEffect(() => {
    if (!orgId) return;
    (async () => {
      const existing = await expensePrefsDb.expensePrefs.get(orgId);
      if (!existing) {
        const p: ExpensePreferences = {
          orgId,
          customPurposes: [],
          updatedAt: Date.now(),
        };
        await expensePrefsDb.expensePrefs.put(p);
      }
    })();
  }, [orgId]);

  const addPurpose = async (label: string) => {
    if (!orgId || !label.trim()) return;
    const p = await expensePrefsDb.expensePrefs.get(orgId);
    const existing = p?.customPurposes || [];
    if (existing.includes(label)) return;
    await expensePrefsDb.expensePrefs.put({
      orgId,
      customPurposes: [...existing, label],
      updatedAt: Date.now(),
    });
  };

  const removePurpose = async (label: string) => {
    if (!orgId) return;
    const p = await expensePrefsDb.expensePrefs.get(orgId);
    const existing = p?.customPurposes || [];
    await expensePrefsDb.expensePrefs.put({
      orgId,
      customPurposes: existing.filter((x) => x !== label),
      updatedAt: Date.now(),
    });
  };

  const purposeOptions = [...DEFAULT_PURPOSES, ...((prefs?.customPurposes) || [])];

  return {
    prefs,
    purposeOptions,
    addPurpose,
    removePurpose,
  };
}