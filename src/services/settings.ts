import { invoke } from '@tauri-apps/api/core'

export const settingsService = {
  getSetting: async (key: string): Promise<string | null> => {
    return await invoke('get_setting', { key })
  },
  setSetting: async (key: string, value: string): Promise<void> => {
    await invoke('set_setting', { key, value })
  },
  resetDatabase: async (): Promise<void> => {
    await invoke('reset_database')
  },
}
