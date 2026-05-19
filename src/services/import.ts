import { invoke } from '@tauri-apps/api/core'
import { ImportResult, CreateTransactionDto } from '@/shared/types'

export const importService = {
  importDocument: async (filePath: string): Promise<ImportResult> => {
    return await invoke('import_document', { filePath })
  },
  importOfx: async (filePath: string): Promise<ImportResult> => {
    return await invoke('import_ofx', { filePath })
  },
  createTransactionsBatch: async (
    transactions: CreateTransactionDto[],
  ): Promise<number> => {
    return await invoke('create_transactions_batch', { transactions })
  },
}
