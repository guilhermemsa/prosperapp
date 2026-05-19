import { invoke } from '@tauri-apps/api/core'
import { Goal, CreateGoalDto } from '@/shared/types'

export const goalService = {
  getGoals: async (): Promise<Goal[]> => {
    return await invoke('get_goals')
  },
  createGoal: async (data: CreateGoalDto): Promise<Goal> => {
    return await invoke('create_goal', { data })
  },
  updateAmount: async (id: string, amount: number): Promise<void> => {
    await invoke('update_goal_amount', { id, amount })
  },
  deleteGoal: async (id: string): Promise<void> => {
    await invoke('delete_goal', { id })
  },
}
