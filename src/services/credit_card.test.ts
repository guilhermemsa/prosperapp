import { describe, it, expect, vi } from 'vitest'
import { creditCardService } from './credit_card'
import { invoke } from '@tauri-apps/api/core'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

describe('Credit Card Service', () => {
  it('should call get_credit_cards', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([])
    await creditCardService.getCreditCards()
    expect(invoke).toHaveBeenCalledWith('get_credit_cards')
  })

  it('should call create_credit_card', async () => {
    const mockData = {
      name: 'Card',
      limit_amount: 1000,
      closing_day: 1,
      due_day: 10,
    }
    vi.mocked(invoke).mockResolvedValueOnce({ id: '1', ...mockData })
    await creditCardService.createCreditCard(mockData)
    expect(invoke).toHaveBeenCalledWith('create_credit_card', {
      data: mockData,
    })
  })

  it('should call delete_credit_card', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined)
    await creditCardService.deleteCreditCard('1')
    expect(invoke).toHaveBeenCalledWith('delete_credit_card', { id: '1' })
  })
})
