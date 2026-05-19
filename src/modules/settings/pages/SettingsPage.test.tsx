import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SettingsPage } from './SettingsPage'
import { useAuthStore } from '@/store/auth'
import userEvent from '@testing-library/user-event'
import { authService } from '@/services/auth'
import { settingsService } from '@/services/settings'

// Mock TanStack Router
const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

// Mock services
vi.mock('@/services/auth', () => ({
  authService: {
    changePassword: vi.fn(),
  },
}))

vi.mock('@/services/settings', () => ({
  settingsService: {
    resetDatabase: vi.fn(),
    getSetting: vi.fn(),
    setSetting: vi.fn(),
  },
}))

// Mock tauri core
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ isAuthenticated: true })
  })

  it('renders settings sections', () => {
    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <SettingsPage />
      </QueryClientProvider>,
    )

    expect(screen.getByText('Configurações')).toBeInTheDocument()
    expect(screen.getByText('Geral')).toBeInTheDocument()
    expect(screen.getByText('Segurança e Sessão')).toBeInTheDocument()
  })

  it('handles logout action', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <SettingsPage />
      </QueryClientProvider>,
    )

    const logoutButton = screen.getByText('Bloquear Aplicativo (Sair)')
    await user.click(logoutButton)

    // Check if auth state changed to false
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    // Check if navigation happened
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' })
  })

  it('shows error if password is less than 6 characters', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <SettingsPage />
      </QueryClientProvider>,
    )

    const passwordInput = screen.getByPlaceholderText('Nova senha')
    const updateButton = screen.getByRole('button', { name: 'Atualizar' })

    await user.type(passwordInput, '12345')
    await user.click(updateButton)

    expect(authService.changePassword).not.toHaveBeenCalled()
    expect(
      screen.getByText('A nova senha deve ter pelo menos 6 caracteres.'),
    ).toBeInTheDocument()
  })

  it('opens confirmation dialog when valid password is submitted', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <SettingsPage />
      </QueryClientProvider>,
    )

    const passwordInput = screen.getByPlaceholderText('Nova senha')
    const updateButton = screen.getByRole('button', { name: 'Atualizar' })

    await user.type(passwordInput, 'senha123')
    await user.click(updateButton)

    // Confirmation dialog should appear
    expect(screen.getByText('Confirmar Alteração de Senha')).toBeInTheDocument()
    expect(
      screen.getByText(/Tem certeza que deseja alterar a senha mestre/),
    ).toBeInTheDocument()
    // Password change should NOT have been called yet
    expect(authService.changePassword).not.toHaveBeenCalled()
  })

  it('updates password successfully after confirmation', async () => {
    vi.mocked(authService.changePassword).mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <SettingsPage />
      </QueryClientProvider>,
    )

    const passwordInput = screen.getByPlaceholderText('Nova senha')
    const updateButton = screen.getByRole('button', { name: 'Atualizar' })

    await user.type(passwordInput, 'senha123')
    await user.click(updateButton)

    // Click confirm in the dialog
    const confirmButton = screen.getByRole('button', {
      name: 'Confirmar Alteração',
    })
    await user.click(confirmButton)

    expect(authService.changePassword).toHaveBeenCalledWith('senha123')
    await waitFor(() => {
      expect(screen.getByText('Senha Alterada com Sucesso')).toBeInTheDocument()
    })
  })

  it('shows error dialog if changePassword fails', async () => {
    vi.mocked(authService.changePassword).mockRejectedValueOnce(
      new Error('Backend error'),
    )
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <SettingsPage />
      </QueryClientProvider>,
    )

    const passwordInput = screen.getByPlaceholderText('Nova senha')
    const updateButton = screen.getByRole('button', { name: 'Atualizar' })

    await user.type(passwordInput, 'senha123')
    await user.click(updateButton)

    // Click confirm in the dialog
    const confirmButton = screen.getByRole('button', {
      name: 'Confirmar Alteração',
    })
    await user.click(confirmButton)

    expect(authService.changePassword).toHaveBeenCalledWith('senha123')
    await waitFor(() => {
      expect(screen.getByText('Erro ao Alterar Senha')).toBeInTheDocument()
    })
  })

  it('cancels password change when clicking cancel in confirmation dialog', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <SettingsPage />
      </QueryClientProvider>,
    )

    const passwordInput = screen.getByPlaceholderText('Nova senha')
    const updateButton = screen.getByRole('button', { name: 'Atualizar' })

    await user.type(passwordInput, 'senha123')
    await user.click(updateButton)

    // Click cancel in the dialog
    const cancelButton = screen.getByRole('button', { name: 'Cancelar' })
    await user.click(cancelButton)

    // Password change should not have been called
    expect(authService.changePassword).not.toHaveBeenCalled()
  })

  it('handles database reset', async () => {
    vi.mocked(settingsService.resetDatabase).mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <SettingsPage />
      </QueryClientProvider>,
    )

    const resetTrigger = screen.getByText('Apagar Tudo')
    await user.click(resetTrigger)

    expect(
      await screen.findByText('Confirmar Exclusão Total'),
    ).toBeInTheDocument()

    const confirmButton = screen.getByRole('button', {
      name: 'Confirmar Exclusão Total',
    })
    await user.click(confirmButton)

    expect(settingsService.resetDatabase).toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.getByText('Dados Apagados com Sucesso')).toBeInTheDocument()
    })
  })
})
