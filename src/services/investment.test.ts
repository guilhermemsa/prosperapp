import { describe, it, expect, vi } from 'vitest'
import { investmentService } from './investment'
import { invoke } from '@tauri-apps/api/core'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

describe('Investment Service', () => {
  it('should call get_investments', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([])
    await investmentService.getInvestments()
    expect(invoke).toHaveBeenCalledWith('get_investments')
  })

  it('should call create_investment', async () => {
    const mockData = {
      name: 'Stock',
      type: 'stock',
      quantity: 10,
      average_price: 100,
      current_price: 105,
    }
    vi.mocked(invoke).mockResolvedValueOnce({ id: '1', ...mockData })
    await investmentService.createInvestment(mockData)
    expect(invoke).toHaveBeenCalledWith('create_investment', { data: mockData })
  })

  it('should call update_investment_price', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined)
    await investmentService.updatePrice('1', 110)
    expect(invoke).toHaveBeenCalledWith('update_investment_price', {
      id: '1',
      currentPrice: 110,
    })
  })

  it('should call delete_investment', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined)
    await investmentService.deleteInvestment('1')
    expect(invoke).toHaveBeenCalledWith('delete_investment', { id: '1' })
  })
})
