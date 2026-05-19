import { invoke } from '@tauri-apps/api/core'
import {
  Transaction,
  CreateTransactionDto,
  UpdateTransactionDto,
} from '@/shared/types'

export const transactionService = {
  getTransactions: async (accountId?: string): Promise<Transaction[]> => {
    return await invoke('get_transactions', { accountId })
  },
  getPaginatedTransactions: async (
    limit: number,
    offset: number,
    accountId?: string,
    searchTerm?: string,
    transactionType?: string,
  ): Promise<{ items: Transaction[]; total: number }> => {
    return await invoke('get_paginated_transactions', {
      limit,
      offset,
      accountId: accountId === 'all' ? undefined : accountId,
      searchTerm,
      transactionType,
    })
  },
  createTransaction: async (
    data: CreateTransactionDto,
  ): Promise<Transaction> => {
    return await invoke('create_transaction', { data })
  },
  updateTransaction: async (
    id: string,
    data: UpdateTransactionDto,
  ): Promise<Transaction> => {
    return await invoke('update_transaction', { id, data })
  },
  deleteTransaction: async (id: string): Promise<void> => {
    await invoke('delete_transaction', { id })
  },
  createTransfer: async (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    description: string | undefined,
    date: string,
  ): Promise<void> => {
    await invoke('create_transfer', {
      fromAccountId,
      toAccountId,
      amount,
      description,
      date,
    })
  },
}
