import { invoke } from '@tauri-apps/api/core'
import { RecurringRule, CreateRecurringRuleDto } from '@/shared/types'

export const recurringService = {
  getRecurringRules: async (): Promise<RecurringRule[]> => {
    return await invoke('get_recurring_rules')
  },
  createRecurringRule: async (
    data: CreateRecurringRuleDto,
  ): Promise<RecurringRule> => {
    return await invoke('create_recurring_rule', { data })
  },
  deleteRecurringRule: async (id: string): Promise<void> => {
    await invoke('delete_recurring_rule', { id })
  },
  processRecurringTransactions: async (): Promise<number> => {
    return await invoke('process_recurring_transactions')
  },
}
