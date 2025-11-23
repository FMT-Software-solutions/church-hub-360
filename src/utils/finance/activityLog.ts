import { supabase } from '@/utils/supabase'
import type { PaymentMethod, FinanceEntityType, FinanceActionType } from '@/types/finance'

export interface FinanceActivityLogInput {
  organization_id: string
  branch_id?: string | null
  entity_type: FinanceEntityType
  entity_id: string
  action_type: FinanceActionType
  amount?: number
  payment_method?: PaymentMethod | string
  actor_id: string
  metadata?: Record<string, any> | null
}

export function sanitizeMetadata<T = any>(obj: T): T {
  const shouldStrip = (key: string) => /(^id$|_id$|^created_by$|^updated_by$|^actor_id$|^organization_id$|^branch_id$|^approved_by$)/i.test(key)
  const walk = (value: any): any => {
    if (Array.isArray(value)) return value.map(walk)
    if (value && typeof value === 'object') {
      const out: Record<string, any> = {}
      for (const [k, v] of Object.entries(value)) {
        if (shouldStrip(k)) continue
        out[k] = walk(v)
      }
      return out
    }
    return value
  }
  return walk(obj)
}

export async function insertFinanceActivityLog(input: FinanceActivityLogInput): Promise<void> {
  const payload = { ...input, metadata: input.metadata ? sanitizeMetadata(input.metadata) : null }
  const { error } = await supabase.from('finance_activity_logs').insert(payload)
  if (error) {
    console.error('Finance activity log insert failed', error)
  }
}
