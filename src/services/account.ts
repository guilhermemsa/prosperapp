import { invoke } from '@tauri-apps/api/core'
import { Account, CreateAccountDto } from '@/shared/types'

export const accountService = {
  getAccounts: async (): Promise<Account[]> => {
    return await invoke('get_accounts')
  },
  createAccount: async (data: CreateAccountDto): Promise<Account> => {
    return await invoke('create_account', { data })
  },
  deleteAccount: async (id: string): Promise<void> => {
    await invoke('delete_account', { id })
  },
}
