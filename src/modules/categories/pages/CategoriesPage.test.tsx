import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CategoriesPage } from './CategoriesPage'
import { categoryService } from '@/services/category'

vi.mock('@/services/category', () => ({
  categoryService: {
    getCategories: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}))

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

describe('CategoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(categoryService.getCategories).mockResolvedValue([])
  })

  it('renders empty state', async () => {
    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <CategoriesPage />
      </QueryClientProvider>,
    )

    expect(
      await screen.findByText('Nenhuma categoria encontrada.'),
    ).toBeInTheDocument()
  })

  it('renders category data', async () => {
    vi.mocked(categoryService.getCategories).mockResolvedValue([
      { id: '1', name: 'Alimentação', type: 'expense', color: '#ff0000' },
    ])

    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <CategoriesPage />
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Alimentação')).toBeInTheDocument()
    expect(screen.getByText('Despesa')).toBeInTheDocument()
  })
})
