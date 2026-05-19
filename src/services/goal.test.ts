import { describe, it, expect, vi } from 'vitest'
import { goalService } from './goal'
import { invoke } from '@tauri-apps/api/core'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

describe('Goal Service', () => {
  it('should call get_goals', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([])
    await goalService.getGoals()
    expect(invoke).toHaveBeenCalledWith('get_goals')
  })

  it('should call create_goal', async () => {
    const mockData = { name: 'Trip', target_amount: 5000, current_amount: 1000 }
    vi.mocked(invoke).mockResolvedValueOnce({ id: '1', ...mockData })
    await goalService.createGoal(mockData)
    expect(invoke).toHaveBeenCalledWith('create_goal', { data: mockData })
  })

  it('should call update_goal_amount', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined)
    await goalService.updateAmount('1', 500)
    expect(invoke).toHaveBeenCalledWith('update_goal_amount', {
      id: '1',
      amount: 500,
    })
  })

  it('should call delete_goal', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined)
    await goalService.deleteGoal('1')
    expect(invoke).toHaveBeenCalledWith('delete_goal', { id: '1' })
  })
})
