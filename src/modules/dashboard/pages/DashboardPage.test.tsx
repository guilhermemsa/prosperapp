import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardPage } from './DashboardPage'
import { accountService } from '@/services/account'
import { transactionService } from '@/services/transaction'
import { creditCardService } from '@/services/credit_card'
import { categoryService } from '@/services/category'
import { goalService } from '@/services/goal'

vi.mock('@/services/account', () => ({
  accountService: {
    getAccounts: vi.fn(),
  },
}))

vi.mock('@/services/transaction', () => ({
  transactionService: {
    getTransactions: vi.fn(),
  },
}))

vi.mock('@/services/credit_card', () => ({
  creditCardService: {
    getCreditCards: vi.fn(),
  },
}))

vi.mock('@/services/category', () => ({
  categoryService: {
    getCategories: vi.fn(),
  },
}))

vi.mock('@/services/goal', () => ({
  goalService: {
    getGoals: vi.fn(),
  },
}))

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(accountService.getAccounts).mockResolvedValue([])
    vi.mocked(transactionService.getTransactions).mockResolvedValue([])
    vi.mocked(creditCardService.getCreditCards).mockResolvedValue([])
    vi.mocked(categoryService.getCategories).mockResolvedValue([])
    vi.mocked(goalService.getGoals).mockResolvedValue([])
  })

  it('renders dashboard with empty data', async () => {
    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Nenhuma conta ativa')).toBeInTheDocument()
    expect(
      screen.getByText('Nenhuma notificação pendente.'),
    ).toBeInTheDocument()
  })

  it('renders dashboard with account data', async () => {
    vi.mocked(accountService.getAccounts).mockResolvedValue([
      { id: '1', name: 'Nubank', type: 'bank', balance: 5000, currency: 'BRL' },
    ])

    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Nubank')).toBeInTheDocument()
    expect(screen.getAllByText(/5\.000,00/)[0]).toBeInTheDocument()
  })
})
