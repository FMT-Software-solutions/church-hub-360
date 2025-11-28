export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'expired';
export type RequestTableName = 'income' | 'expense' | 'pledge_payment' | 'pledge_record';

export interface EditRequest {
  id: string;
  organization_id: string;
  table_name: RequestTableName;
  record_id: string;
  requester_id: string;
  reason: string;
  status: RequestStatus;
  reviewer_id?: string | null;
  reviewer_note?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  
  // Joins
  requester?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface AppNotification {
  id: string;
  organization_id: string;
  recipient_id: string;
  type: string;
  title: string;
  message: string | null;
  resource_type: string | null;
  resource_id: string | null;
  is_read: boolean;
  created_at: string;
  metadata?: string | null;
}
