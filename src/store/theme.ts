import { create } from 'zustand'

export type Theme = 'system' | 'light' | 'dark'
export type ThemeColor = 'zinc' | 'rose' | 'blue' | 'green' | 'orange'

interface ThemeState {
  theme: Theme
  themeColor: ThemeColor
  setTheme: (theme: Theme) => void
  setThemeColor: (color: ThemeColor) => void
  initializeTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme:
    (typeof localStorage !== 'undefined' && localStorage.getItem
      ? (localStorage.getItem('prosperapp_theme') as Theme)
      : null) || 'light',
  themeColor:
    (typeof localStorage !== 'undefined' && localStorage.getItem
      ? (localStorage.getItem('prosperapp_theme_color') as ThemeColor)
      : null) || 'green',

  setTheme: (theme) => {
    if (typeof localStorage !== 'undefined' && localStorage.setItem) {
      localStorage.setItem('prosperapp_theme', theme)
    }
    set({ theme })
    get().initializeTheme()
  },

  setThemeColor: (themeColor) => {
    if (typeof localStorage !== 'undefined' && localStorage.setItem) {
      localStorage.setItem('prosperapp_theme_color', themeColor)
    }
    set({ themeColor })
    get().initializeTheme()
  },

  initializeTheme: () => {
    const { theme, themeColor } = get()
    const root = window.document.documentElement

    root.classList.remove(
      'light',
      'dark',
      'theme-zinc',
      'theme-rose',
      'theme-blue',
      'theme-green',
      'theme-orange',
    )

    if (theme === 'system') {
      const systemTheme =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }

    if (themeColor !== 'zinc') {
      root.classList.add(`theme-${themeColor}`)
    }
  },
}))

// Add a listener for system theme changes
if (typeof window !== 'undefined' && window.matchMedia) {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      if (useThemeStore.getState().theme === 'system') {
        useThemeStore.getState().initializeTheme()
      }
    })
}
