import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAutoLock } from './useAutoLock'
import { useAuthStore } from '@/store/auth'

// Mock TanStack Router
const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

describe('useAutoLock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    useAuthStore.setState({ isAuthenticated: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should lock the app after timeout', () => {
    renderHook(() => useAutoLock())

    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000)
    })

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' })
  })

  it('should reset the timer on activity', () => {
    renderHook(() => useAutoLock())

    act(() => {
      vi.advanceTimersByTime(4 * 60 * 1000)
    })

    act(() => {
      window.dispatchEvent(new MouseEvent('mousedown'))
    })

    act(() => {
      vi.advanceTimersByTime(2 * 60 * 1000)
    })

    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(mockNavigate).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(3 * 60 * 1000)
    })

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' })
  })

  it('should not start timer if not authenticated', () => {
    useAuthStore.setState({ isAuthenticated: false })
    renderHook(() => useAutoLock())

    act(() => {
      vi.advanceTimersByTime(6 * 60 * 1000)
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
