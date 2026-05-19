import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { InvestmentsPage } from './InvestmentsPage'
import { investmentService } from '@/services/investment'

vi.mock('@/services/investment', () => ({
  investmentService: {
    getInvestments: vi.fn(),
    createInvestment: vi.fn(),
    deleteInvestment: vi.fn(),
  },
}))

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

describe('InvestmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(investmentService.getInvestments).mockResolvedValue([])
  })

  it('renders empty state', async () => {
    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <InvestmentsPage />
      </QueryClientProvider>,
    )

    expect(
      await screen.findByText('Nenhum investimento registrado.'),
    ).toBeInTheDocument()
  })

  it('renders investment data', async () => {
    vi.mocked(investmentService.getInvestments).mockResolvedValue([
      {
        id: '1',
        name: 'Petrobras',
        type: 'stock',
        ticker: 'PETR4',
        quantity: 100,
        average_price: 30,
        current_price: 35,
      },
    ])

    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <InvestmentsPage />
      </QueryClientProvider>,
    )

    expect(await screen.findByText('PETR4')).toBeInTheDocument()
    // Current value = 100 * 35 = 3500
    expect(screen.getByText(/3\.500,00/)).toBeInTheDocument()
  })
})
