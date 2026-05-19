import { describe, it, expect, vi } from 'vitest'
import { accountService } from './account'
import { invoke } from '@tauri-apps/api/core'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

describe('Account Service', () => {
  it('should call get_accounts', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([
      { id: '1', name: 'Test', balance: 0 },
    ])
    const accounts = await accountService.getAccounts()
    expect(invoke).toHaveBeenCalledWith('get_accounts')
    expect(accounts).toHaveLength(1)
    expect(accounts[0].name).toBe('Test')
  })

  it('should call create_account with data', async () => {
    const mockData = {
      name: 'Test',
      type: 'bank',
      balance: 100,
      currency: 'BRL',
    }
    vi.mocked(invoke).mockResolvedValueOnce({ id: '1', ...mockData })

    const account = await accountService.createAccount(mockData)
    expect(invoke).toHaveBeenCalledWith('create_account', { data: mockData })
    expect(account.id).toBe('1')
    expect(account.balance).toBe(100)
  })

  it('should call delete_account with id', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined)
    await accountService.deleteAccount('1')
    expect(invoke).toHaveBeenCalledWith('delete_account', { id: '1' })
  })
})
