import { describe, it, expect, vi } from 'vitest'
import { authService } from './auth'
import { invoke } from '@tauri-apps/api/core'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

describe('Auth Service', () => {
  it('should call check_onboarding', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(true)
    const result = await authService.checkOnboarding()
    expect(invoke).toHaveBeenCalledWith('check_onboarding')
    expect(result).toBe(true)
  })

  it('should call setup_password', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined)
    await authService.setupPassword('pass123')
    expect(invoke).toHaveBeenCalledWith('setup_password', {
      password: 'pass123',
    })
  })

  it('should call login', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined)
    await authService.login('pass123')
    expect(invoke).toHaveBeenCalledWith('login', { password: 'pass123' })
  })

  it('should call change_password', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined)
    await authService.changePassword('newpass123')
    expect(invoke).toHaveBeenCalledWith('change_password', {
      newPassword: 'newpass123',
    })
  })
})
