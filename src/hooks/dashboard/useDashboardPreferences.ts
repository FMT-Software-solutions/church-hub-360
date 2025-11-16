import { useCallback, useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  dashboardPrefsDb,
  type DashboardPrefs,
  defaultDashboardPreferences,
  type DashboardSectionId,
} from '@/db/dashboardPrefsDb'

export function useDashboardPreferences(orgId?: string) {
  const prefs = useLiveQuery(async () => {
    if (!orgId) return undefined
    return await dashboardPrefsDb.dashboardPrefs.get(orgId)
  }, [orgId])

  const initRef = useRef(false)
  useEffect(() => {
    if (!orgId) return
    if (prefs === undefined && !initRef.current) {
      initRef.current = true
      ;(async () => {
        const found = await dashboardPrefsDb.dashboardPrefs.get(orgId)
        if (!found) {
          await dashboardPrefsDb.dashboardPrefs.put(defaultDashboardPreferences(orgId))
        }
        initRef.current = false
      })()
    }
  }, [orgId, prefs])

  const isLoading = !orgId || !prefs

  const save = useCallback(async (next: DashboardPrefs) => {
    await dashboardPrefsDb.dashboardPrefs.put({ ...next, updatedAt: Date.now() })
  }, [])

  const setSectionVisibility = useCallback(
    async (section: DashboardSectionId, visible: boolean) => {
      if (!prefs) return
      await save({ ...prefs, sections: { ...prefs.sections, [section]: visible } })
    },
    [prefs, save]
  )

  const setComponentVisibility = useCallback(
    async (componentId: string, visible: boolean) => {
      if (!prefs) return
      const cv = prefs.componentsVisibility || {}
      await save({ ...prefs, componentsVisibility: { ...cv, [componentId]: visible } })
    },
    [prefs, save]
  )

  return { prefs, isLoading, save, setSectionVisibility, setComponentVisibility }
}

export type { DashboardPrefs, DashboardSectionId }