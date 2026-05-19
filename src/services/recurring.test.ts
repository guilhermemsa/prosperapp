import { describe, it, expect, vi, beforeEach } from 'vitest'
import { recurringService } from './recurring'
import { invoke } from '@tauri-apps/api/core'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

describe('Recurring Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call get_recurring_rules', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([])
    await recurringService.getRecurringRules()
    expect(invoke).toHaveBeenCalledWith('get_recurring_rules')
  })

  it('should call create_recurring_rule', async () => {
    const mockData = {
      account_id: '1',
      amount: 100,
      type: 'expense',
      interval_type: 'monthly',
      start_date: '2023-01-01',
    }
    vi.mocked(invoke).mockResolvedValueOnce({ id: '1', ...mockData })
    await recurringService.createRecurringRule(mockData)
    expect(invoke).toHaveBeenCalledWith('create_recurring_rule', {
      data: mockData,
    })
  })

  it('should call delete_recurring_rule', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined)
    await recurringService.deleteRecurringRule('1')
    expect(invoke).toHaveBeenCalledWith('delete_recurring_rule', { id: '1' })
  })

  it('should call process_recurring_transactions', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(5)
    const count = await recurringService.processRecurringTransactions()
    expect(invoke).toHaveBeenCalledWith('process_recurring_transactions')
    expect(count).toBe(5)
  })
})
