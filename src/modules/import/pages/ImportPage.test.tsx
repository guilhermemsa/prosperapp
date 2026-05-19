import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ImportPage } from './ImportPage'
import { accountService } from '@/services/account'
import { categoryService } from '@/services/category'
import { settingsService } from '@/services/settings'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('@/services/import', () => ({
  importService: {
    importDocument: vi.fn(),
    createTransactionsBatch: vi.fn(),
  },
}))

vi.mock('@/services/account', () => ({
  accountService: {
    getAccounts: vi.fn(),
  },
}))

vi.mock('@/services/category', () => ({
  categoryService: {
    getCategories: vi.fn(),
  },
}))

vi.mock('@/services/settings', () => ({
  settingsService: {
    getSetting: vi.fn(),
  },
}))

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

describe('ImportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(accountService.getAccounts).mockResolvedValue([])
    vi.mocked(categoryService.getCategories).mockResolvedValue([])
    vi.mocked(settingsService.getSetting).mockResolvedValue('fake-api-key')
  })

  it('renders import page initial state', async () => {
    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <ImportPage />
      </QueryClientProvider>,
    )

    expect(
      await screen.findByText('Importação Inteligente'),
    ).toBeInTheDocument()
    expect(
      await screen.findByText('Arraste um documento aqui'),
    ).toBeInTheDocument()
  })
})
