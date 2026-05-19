import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TransactionsPage } from './TransactionsPage'
import { transactionService } from '@/services/transaction'
import { accountService } from '@/services/account'
import { categoryService } from '@/services/category'
import { recurringService } from '@/services/recurring'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('@/services/transaction', () => ({
  transactionService: {
    getTransactions: vi.fn(),
    getPaginatedTransactions: vi.fn(),
    createTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
    createTransfer: vi.fn(),
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

vi.mock('@/services/recurring', () => ({
  recurringService: {
    getRecurringRules: vi.fn(),
    createRecurringRule: vi.fn(),
    deleteRecurringRule: vi.fn(),
    processRecurringTransactions: vi.fn(),
  },
}))

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

describe('TransactionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(accountService.getAccounts).mockResolvedValue([])
    vi.mocked(categoryService.getCategories).mockResolvedValue([])
    vi.mocked(transactionService.getPaginatedTransactions).mockResolvedValue({
      items: [],
      total: 0,
    })
    vi.mocked(recurringService.processRecurringTransactions).mockResolvedValue(
      0,
    )
  })

  it('renders empty state', async () => {
    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <TransactionsPage />
      </QueryClientProvider>,
    )

    expect(
      await screen.findByText('Nenhuma transação registrada.'),
    ).toBeInTheDocument()
  })

  it('renders transaction data', async () => {
    vi.mocked(transactionService.getPaginatedTransactions).mockResolvedValue({
      items: [
        {
          id: '1',
          account_id: '1',
          amount: 150,
          type: 'expense',
          description: 'Grocery',
          date: '2023-05-11',
        },
      ],
      total: 1,
    })

    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <TransactionsPage />
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Grocery')).toBeInTheDocument()
  })

  it('handles pagination next and previous', async () => {
    vi.mocked(transactionService.getPaginatedTransactions).mockResolvedValue({
      items: [
        {
          id: '1',
          account_id: '1',
          amount: 150,
          type: 'expense',
          description: 'Page 1',
          date: '2023-05-11',
        },
      ],
      total: 25,
    })

    const user = userEvent.setup()
    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <TransactionsPage />
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Page 1')).toBeInTheDocument()
    expect(
      screen.getByText('Página 1 de 3 (Total: 25 transações)'),
    ).toBeInTheDocument()

    const nextBtn = screen.getByText('Próxima')
    await user.click(nextBtn)

    expect(transactionService.getPaginatedTransactions).toHaveBeenCalledWith(
      10,
      10,
      'all',
      '',
      'all',
    )
  })

  it('opens create transaction dialog', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <TransactionsPage />
      </QueryClientProvider>,
    )

    const createBtn = screen.getByText('Nova Transação')
    await user.click(createBtn)

    expect(await screen.findByText('Confirmar')).toBeInTheDocument()
    expect(screen.getAllByText('Valor').length).toBeGreaterThan(0)
  })
})
