import { create } from 'zustand'

interface AuthState {
  isAuthenticated: boolean
  isLocked: boolean
  isOnboarded: boolean | null
  setAuthenticated: (value: boolean) => void
  setLocked: (value: boolean) => void
  setOnboarded: (value: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLocked: true,
  isOnboarded: null,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setLocked: (value) => set({ isLocked: value }),
  setOnboarded: (value) => set({ isOnboarded: value }),
}))
