import Dexie, { type Table } from 'dexie'

export type DashboardSectionId =
  | 'birthdays'
  | 'events'
  | 'membership'
  | 'tags_groups'
  | 'attendance'
  | 'finances'
  | 'assets'
  | 'branches'
  | 'recent_groups'
  | 'announcements'
  | 'finance_breakdown_chart'
  | 'attendance_trend_chart'
  | 'members_gender_chart'

export interface DashboardPreferences {
  orgId: string
  updatedAt: number
  sections: Record<DashboardSectionId, boolean>
  componentsVisibility?: Record<string, boolean>
}

class ChurchHubDashboardPrefsDB extends Dexie {
  dashboardPrefs!: Table<DashboardPreferences, string>

  constructor() {
    super('ChurchHubDashboardPrefsDB')
    this.version(1).stores({
      dashboardPrefs: '&orgId',
    })
  }
}

export const dashboardPrefsDb = new ChurchHubDashboardPrefsDB()

export const DEFAULT_SECTIONS: Record<DashboardSectionId, boolean> = {
  birthdays: false,
  events: false,
  membership: true,
  tags_groups: true,
  attendance: true,
  finances: true,
  assets: true,
  branches: true,
  recent_groups: true,
  announcements: true,
  finance_breakdown_chart: true,
  attendance_trend_chart: true,
  members_gender_chart: true,
}

export function defaultDashboardPreferences(orgId: string): DashboardPreferences {
  return {
    orgId,
    updatedAt: Date.now(),
    sections: DEFAULT_SECTIONS,
    componentsVisibility: {},
  }
}

export type { DashboardPreferences as DashboardPrefs }