import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth'
import { useNavigate } from '@tanstack/react-router'

const AUTO_LOCK_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

export function useAutoLock() {
  const { setAuthenticated, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const lockApp = async () => {
    if (!isAuthenticated) return

    try {
      setAuthenticated(false)
      // Tauri backend state should probably be updated too, though we rely on frontend state mostly.
      // If there's an 'lock_app' command we could call it here. For now frontend auth reset is sufficient.
      navigate({ to: '/login' })
    } catch (e) {
      console.error('Failed to auto-lock', e)
    }
  }

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (isAuthenticated) {
      timeoutRef.current = setTimeout(lockApp, AUTO_LOCK_TIMEOUT_MS)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      return
    }

    resetTimer()

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
    ]
    const handleActivity = () => resetTimer()

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [isAuthenticated])
}
