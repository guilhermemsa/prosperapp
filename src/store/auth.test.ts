import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './auth'

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: false,
      isLocked: true,
      isOnboarded: null,
    })
  })

  it('should have initial state', () => {
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isLocked).toBe(true)
    expect(state.isOnboarded).toBeNull()
  })

  it('should set authenticated state', () => {
    useAuthStore.getState().setAuthenticated(true)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('should set locked state', () => {
    useAuthStore.getState().setLocked(false)
    expect(useAuthStore.getState().isLocked).toBe(false)
  })

  it('should set onboarded state', () => {
    useAuthStore.getState().setOnboarded(true)
    expect(useAuthStore.getState().isOnboarded).toBe(true)
  })
})
