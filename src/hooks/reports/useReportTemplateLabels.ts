import { useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  reportPrefsDb,
  type ReportTemplatePreferences,
  type ReportTemplateId,
  defaultReportTemplatePreferences,
} from '@/db/reportTemplatePrefsDb';

// Generic hook: pass a templateId and defaults; get live labels and a setter
export function useReportTemplateLabels<T extends Record<string, string>>(
  templateId: ReportTemplateId,
  defaults: T
) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  const prefId = orgId ? `${orgId}:${templateId}` : undefined;

  const prefs = useLiveQuery(async () => {
    if (!prefId) return null;
    return await reportPrefsDb.reportTemplatePrefs.get(prefId);
  }, [prefId]);

  // Ensure a record exists when org/template are known
  useEffect(() => {
    if (!orgId) return;
    (async () => {
      const id = `${orgId}:${templateId}`;
      const existing = await reportPrefsDb.reportTemplatePrefs.get(id);
      if (!existing) {
        const initial: ReportTemplatePreferences = defaultReportTemplatePreferences(
          orgId,
          templateId,
          defaults
        );
        await reportPrefsDb.reportTemplatePrefs.put(initial);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, templateId]);

  const labels: T = useMemo(() => {
    const stored = prefs?.labels;
    // Merge to ensure any newer default keys appear without losing overrides
    const merged: Record<string, string> = { ...defaults, ...(stored || {}) };
    return merged as T;
  }, [prefs, defaults]);

  const setLabel = async (key: keyof T, value: string) => {
    if (!orgId) return;
    const id = `${orgId}:${templateId}`;
    const existing = (await reportPrefsDb.reportTemplatePrefs.get(id)) ??
      defaultReportTemplatePreferences(orgId, templateId, defaults);
    const next: ReportTemplatePreferences = {
      ...existing,
      labels: { ...existing.labels, [key as string]: value },
      updatedAt: Date.now(),
    };
    await reportPrefsDb.reportTemplatePrefs.put(next);
  };

  return {
    labels,
    setLabel,
    ready: !!orgId,
  };
}