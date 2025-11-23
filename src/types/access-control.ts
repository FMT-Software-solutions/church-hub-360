export type SectionKey =
  | 'branches'
  | 'people'
  | 'finance'
  | 'events'
  | 'announcements'
  | 'assets'
  | 'user_management'
  | 'settings';

export type FinanceChildKey =
  | 'insights'
  | 'income'
  | 'expenses'
  | 'contributions'
  | 'pledges'
  | 'activity_logs';

export interface VisibilityOverrides {
  sections?: {
    branches?: boolean;
    people?: {
      enabled?: boolean;
      tags_groups?: boolean;
      membership?: boolean;
      attendance?: boolean;
      form_builder?: boolean;
    };
    finance?: {
      enabled?: boolean;
      insights?: boolean;
      income?: boolean;
      expenses?: boolean;
      contributions?: boolean;
      pledges?: boolean;
      activity_logs?: boolean;
    };
    events?: boolean;
    announcements?: boolean;
    assets?: boolean;
    user_management?: boolean;
    settings?: boolean;
  };
}

export interface UserCapabilities {
  can_create_users?: boolean;
}

export interface UserPermissions {
  visibility_overrides?: VisibilityOverrides;
  capabilities?: UserCapabilities;
}
