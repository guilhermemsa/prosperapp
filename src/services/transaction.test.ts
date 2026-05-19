import { describe, it, expect, vi, beforeEach } from 'vitest'
import { transactionService } from './transaction'
import { invoke } from '@tauri-apps/api/core'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

describe('Transaction Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call get_transactions', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([])
    await transactionService.getTransactions()
    expect(invoke).toHaveBeenCalledWith('get_transactions', {
      accountId: undefined,
    })
  })

  it('should call get_paginated_transactions', async () => {
    vi.mocked(invoke).mockResolvedValueOnce({ items: [], total: 0 })
    await transactionService.getPaginatedTransactions(10, 0, 'acc-1')
    expect(invoke).toHaveBeenCalledWith('get_paginated_transactions', {
      limit: 10,
      offset: 0,
      accountId: 'acc-1',
    })
  })

  it('should call create_transaction', async () => {
    const mockData = {
      account_id: '1',
      amount: 100,
      type: 'expense',
      date: '2023-01-01',
    }
    vi.mocked(invoke).mockResolvedValueOnce({ id: '1', ...mockData })
    await transactionService.createTransaction(mockData)
    expect(invoke).toHaveBeenCalledWith('create_transaction', {
      data: mockData,
    })
  })

  it('should call update_transaction', async () => {
    const mockData = { amount: 150, type: 'expense' }
    vi.mocked(invoke).mockResolvedValueOnce({ id: '1', ...mockData })
    await transactionService.updateTransaction('1', mockData)
    expect(invoke).toHaveBeenCalledWith('update_transaction', {
      id: '1',
      data: mockData,
    })
  })

  it('should call delete_transaction', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined)
    await transactionService.deleteTransaction('1')
    expect(invoke).toHaveBeenCalledWith('delete_transaction', { id: '1' })
  })

  it('should call create_transfer', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined)
    await transactionService.createTransfer(
      'acc-1',
      'acc-2',
      500,
      'Rent',
      '2023-01-01',
    )
    expect(invoke).toHaveBeenCalledWith('create_transfer', {
      fromAccountId: 'acc-1',
      toAccountId: 'acc-2',
      amount: 500,
      description: 'Rent',
      date: '2023-01-01',
    })
  })
})
