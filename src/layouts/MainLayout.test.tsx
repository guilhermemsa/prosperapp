import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MainLayout } from './MainLayout'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(0),
}))

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  useNavigate: () => vi.fn(),
}))

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

describe('MainLayout', () => {
  it('renders sidebar with all menu items', () => {
    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <MainLayout />
      </QueryClientProvider>,
    )

    // Verify brand
    expect(screen.getAllByText('ProsperApp').length).toBeGreaterThan(0)

    // Verify main menu items
    const expectedLinks = [
      { text: 'Dashboard', href: '/' },
      { text: 'Transações', href: '/transactions' },
      { text: 'Contas', href: '/accounts' },
      { text: 'Cartões', href: '/cards' },
      { text: 'Investimentos', href: '/investments' },
      { text: 'Metas', href: '/goals' },
      { text: 'Relatórios', href: '/reports' },
      { text: 'Categorias', href: '/categories' },
      { text: 'Importação', href: '/import' },
      { text: 'Configurações', href: '/settings' },
    ]

    expectedLinks.forEach((link) => {
      const element = screen.getByText(link.text)
      expect(element).toBeInTheDocument()
      expect(element.closest('a')).toHaveAttribute('href', link.href)
    })
  })

  it('renders the outlet for child routes', () => {
    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <MainLayout />
      </QueryClientProvider>,
    )
    expect(screen.getByTestId('outlet')).toBeInTheDocument()
  })
})
