import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AccountsPage } from './AccountsPage'
import { accountService } from '@/services/account'

// Mock the API service
vi.mock('@/services/account', () => ({
  accountService: {
    getAccounts: vi.fn(),
    createAccount: vi.fn(),
    deleteAccount: vi.fn(),
  },
}))

vi.mock('@edusites/bancos-brasil', () => ({
  svgBanco: vi.fn().mockResolvedValue('<svg></svg>'),
}))

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

describe('AccountsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state and then empty state when no accounts exist', async () => {
    vi.mocked(accountService.getAccounts).mockResolvedValueOnce([])
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <AccountsPage />
      </QueryClientProvider>,
    )

    // Should initially show loading text
    expect(screen.getByText('Carregando contas...')).toBeInTheDocument()

    // Wait for the mock to resolve and check for empty state
    const emptyStateMessage = await screen.findByText(
      'Nenhuma conta encontrada. Crie sua primeira conta para começar.',
    )
    expect(emptyStateMessage).toBeInTheDocument()
  })

  it('renders a list of accounts when data is returned', async () => {
    vi.mocked(accountService.getAccounts).mockResolvedValueOnce([
      { id: '1', name: 'Nubank', type: 'bank', balance: 1500, currency: 'BRL' },
      {
        id: '2',
        name: 'Carteira',
        type: 'wallet',
        balance: 250.5,
        currency: 'BRL',
      },
    ])
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <AccountsPage />
      </QueryClientProvider>,
    )

    // Check if account names render
    const nubankAccount = await screen.findByText('Nubank')
    const walletAccounts = await screen.findAllByText('Carteira')
    const walletAccount = walletAccounts[0]

    expect(nubankAccount).toBeInTheDocument()
    expect(walletAccount).toBeInTheDocument()

    // Check if balances render correctly
    expect(screen.getByText(/1\.500,00/)).toBeInTheDocument()
    expect(screen.getByText(/250,50/)).toBeInTheDocument()
  })
})
