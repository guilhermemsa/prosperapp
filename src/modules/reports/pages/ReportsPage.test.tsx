import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReportsPage } from './ReportsPage'
import { transactionService } from '@/services/transaction'
import { categoryService } from '@/services/category'
import { accountService } from '@/services/account'

vi.mock('@/services/transaction', () => ({
  transactionService: {
    getTransactions: vi.fn(),
  },
}))

vi.mock('@/services/category', () => ({
  categoryService: {
    getCategories: vi.fn(),
  },
}))

vi.mock('@/services/account', () => ({
  accountService: {
    getAccounts: vi.fn(),
  },
}))

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

describe('ReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(transactionService.getTransactions).mockResolvedValue([])
    vi.mocked(categoryService.getCategories).mockResolvedValue([])
    vi.mocked(accountService.getAccounts).mockResolvedValue([])
  })

  it('renders reports page correctly with empty data', async () => {
    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <ReportsPage />
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Relatórios')).toBeInTheDocument()
    expect(
      screen.getByText('Nenhuma despesa no mês atual.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Nenhum gasto registrado neste mês.'),
    ).toBeInTheDocument()
  })

  it('renders top expenses correctly', async () => {
    vi.mocked(transactionService.getTransactions).mockResolvedValue([
      {
        id: '1',
        account_id: 'a1',
        amount: 500,
        type: 'expense',
        description: 'Mercado',
        date: new Date().toISOString(),
        category_id: 'c1',
        tags: undefined,

      },
      {
        id: '2',
        account_id: 'a1',
        amount: 1500,
        type: 'expense',
        description: 'Aluguel',
        date: new Date().toISOString(),
        category_id: 'c2',
        tags: undefined,

      },
    ])

    vi.mocked(categoryService.getCategories).mockResolvedValue([
      { id: 'c1', name: 'Alimentação', color: '#ff0000', type: 'expense' },
      { id: 'c2', name: 'Moradia', color: '#00ff00', type: 'expense' },
    ])

    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <ReportsPage />
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Aluguel')).toBeInTheDocument()
    expect(screen.getByText('Moradia')).toBeInTheDocument()
    expect(screen.getByText('Mercado')).toBeInTheDocument()
  })
})
