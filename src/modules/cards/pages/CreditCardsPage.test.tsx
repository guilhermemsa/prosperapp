import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CreditCardsPage } from './CreditCardsPage'
import { creditCardService } from '@/services/credit_card'
import { accountService } from '@/services/account'

vi.mock('@/services/credit_card', () => ({
  creditCardService: {
    getCreditCards: vi.fn(),
    createCreditCard: vi.fn(),
    deleteCreditCard: vi.fn(),
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

describe('CreditCardsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(accountService.getAccounts).mockResolvedValue([])
    vi.mocked(creditCardService.getCreditCards).mockResolvedValue([])
  })

  it('renders empty state', async () => {
    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <CreditCardsPage />
      </QueryClientProvider>,
    )

    expect(
      await screen.findByText('Nenhum cartão cadastrado.'),
    ).toBeInTheDocument()
  })

  it('renders credit card data', async () => {
    vi.mocked(creditCardService.getCreditCards).mockResolvedValue([
      {
        id: '1',
        name: 'Visa Infinite',
        limit_amount: 10000,
        closing_day: 1,
        due_day: 10,
      },
    ])

    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <CreditCardsPage />
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Visa Infinite')).toBeInTheDocument()
    expect(screen.getByText(/10\.000,00/)).toBeInTheDocument()
  })
})
