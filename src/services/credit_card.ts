import { invoke } from '@tauri-apps/api/core'
import { CreditCard, CreateCreditCardDto } from '@/shared/types'

export const creditCardService = {
  getCreditCards: async (): Promise<CreditCard[]> => {
    return await invoke('get_credit_cards')
  },
  createCreditCard: async (data: CreateCreditCardDto): Promise<CreditCard> => {
    return await invoke('create_credit_card', { data })
  },
  deleteCreditCard: async (id: string): Promise<void> => {
    await invoke('delete_credit_card', { id })
  },
}
