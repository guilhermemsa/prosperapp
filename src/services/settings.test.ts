import { describe, it, expect, vi, beforeEach } from 'vitest'
import { settingsService } from './settings'
import { invoke } from '@tauri-apps/api/core'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

describe('Settings Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call get_setting', async () => {
    vi.mocked(invoke).mockResolvedValueOnce('test-value')
    const val = await settingsService.getSetting('test-key')
    expect(invoke).toHaveBeenCalledWith('get_setting', { key: 'test-key' })
    expect(val).toBe('test-value')
  })

  it('should call set_setting', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined)
    await settingsService.setSetting('test-key', 'test-value')
    expect(invoke).toHaveBeenCalledWith('set_setting', {
      key: 'test-key',
      value: 'test-value',
    })
  })

  it('should call reset_database', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined)
    await settingsService.resetDatabase()
    expect(invoke).toHaveBeenCalledWith('reset_database')
  })
})
