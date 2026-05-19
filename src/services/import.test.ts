import { describe, it, expect, vi, beforeEach } from 'vitest'
import { importService } from './import'
import { invoke } from '@tauri-apps/api/core'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

describe('Import Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call import_document', async () => {
    vi.mocked(invoke).mockResolvedValueOnce({ transactions: [], summary: {} })
    await importService.importDocument('test.pdf')
    expect(invoke).toHaveBeenCalledWith('import_document', {
      filePath: 'test.pdf',
    })
  })

  it('should call create_transactions_batch', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined)
    await importService.createTransactionsBatch([])
    expect(invoke).toHaveBeenCalledWith('create_transactions_batch', {
      transactions: [],
    })
  })
})
