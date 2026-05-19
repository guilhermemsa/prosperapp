import { invoke } from '@tauri-apps/api/core'

export const authService = {
  checkOnboarding: async (): Promise<boolean> => {
    return await invoke('check_onboarding')
  },
  setupPassword: async (password: string): Promise<void> => {
    await invoke('setup_password', { password })
  },
  login: async (password: string): Promise<void> => {
    await invoke('login', { password })
  },
  changePassword: async (newPassword: string): Promise<void> => {
    await invoke('change_password', { newPassword })
  },
}
