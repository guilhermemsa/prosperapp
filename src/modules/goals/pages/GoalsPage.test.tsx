import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoalsPage } from './GoalsPage'
import { goalService } from '@/services/goal'

vi.mock('@/services/goal', () => ({
  goalService: {
    getGoals: vi.fn(),
    createGoal: vi.fn(),
    deleteGoal: vi.fn(),
  },
}))

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

describe('GoalsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(goalService.getGoals).mockResolvedValue([])
  })

  it('renders empty state', async () => {
    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <GoalsPage />
      </QueryClientProvider>,
    )

    expect(
      await screen.findByText(
        'Nenhuma meta definida. Qual é o seu próximo grande sonho?',
      ),
    ).toBeInTheDocument()
  })

  it('renders goal data', async () => {
    vi.mocked(goalService.getGoals).mockResolvedValue([
      {
        id: '1',
        name: 'Carro Novo',
        target_amount: 50000,
        current_amount: 10000,
      },
    ])

    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <GoalsPage />
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Carro Novo')).toBeInTheDocument()
    const targetElement = screen.getByText(/50\.000/i)
    expect(targetElement).toBeInTheDocument()
  })
})
