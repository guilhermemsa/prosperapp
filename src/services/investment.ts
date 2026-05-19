import { invoke } from '@tauri-apps/api/core'
import { Investment, CreateInvestmentDto } from '@/shared/types'

export const investmentService = {
  getInvestments: async (): Promise<Investment[]> => {
    return await invoke('get_investments')
  },
  createInvestment: async (data: CreateInvestmentDto): Promise<Investment> => {
    return await invoke('create_investment', { data })
  },
  updatePrice: async (id: string, currentPrice: number): Promise<void> => {
    await invoke('update_investment_price', { id, currentPrice })
  },
  deleteInvestment: async (id: string): Promise<void> => {
    await invoke('delete_investment', { id })
  },
}
