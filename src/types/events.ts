export type EventActivityType = 'event' | 'activity' | 'announcement';

export type ReminderMethod = 'none' | 'email' | 'push' | 'sms';

export interface EventActivity {
  id: string;
  organization_id: string;
  branch_id?: string | null;
  title: string;
  description?: string | null;
  type: EventActivityType;
  category?: string | null;
  start_time: string; // ISO timestamp
  end_time?: string | null; // ISO timestamp
  all_day: boolean;
  location?: string | null;
  remind_at?: string | null; // ISO timestamp
  remind_method: ReminderMethod;
  is_active: boolean;
  is_deleted: boolean;
  created_by?: string | null;
  last_updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEventActivityInput {
  organization_id: string;
  branch_id?: string | null;
  title: string;
  description?: string;
  type?: EventActivityType;
  category?: string;
  start_time: string; // ISO timestamp
  end_time?: string; // ISO timestamp
  all_day?: boolean;
  location?: string;
  remind_at?: string;
  remind_method?: ReminderMethod;
  is_active?: boolean;
}

export interface UpdateEventActivityInput {
  branch_id?: string | null;
  title?: string;
  description?: string | null;
  type?: EventActivityType;
  category?: string | null;
  start_time?: string;
  end_time?: string | null;
  all_day?: boolean;
  location?: string | null;
  remind_at?: string | null;
  remind_method?: ReminderMethod;
  is_active?: boolean;
}

export type EventActivityStatus = 'upcoming' | 'ongoing' | 'past';

export interface EventActivityWithRelations extends EventActivity {
  branch_name?: string | null;
  created_by_name?: string | null;
  status?: EventActivityStatus;
}

export interface EventActivityFilters {
  branch_id?: string;
  type?: EventActivityType;
  status?: EventActivityStatus;
  date_from?: string; // ISO timestamp
  date_to?: string;   // ISO timestamp
  search?: string;
  is_active?: boolean;
}

export type EventActivitySortField =
  | 'start_time'
  | 'end_time'
  | 'title'
  | 'created_at'
  | 'updated_at';

export interface EventActivitySort {
  field: EventActivitySortField;
  direction: 'asc' | 'desc';
}

export interface EventActivityPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface EventActivityListResponse {
  data: EventActivityWithRelations[];
  pagination: EventActivityPagination;
}

