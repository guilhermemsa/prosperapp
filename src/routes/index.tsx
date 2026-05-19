import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useNavigate,
} from '@tanstack/react-router'
import { useEffect, useState, lazy, Suspense } from 'react'
import { MainLayout } from '@/layouts/MainLayout'
import { useAuthStore } from '@/store/auth'
import { authService } from '@/services/auth'
import { Loader2 } from 'lucide-react'

// Lazy load components
const DashboardPage = lazy(() =>
  import('@/modules/dashboard/pages/DashboardPage').then((m) => ({
    default: m.DashboardPage,
  })),
)
const AccountsPage = lazy(() =>
  import('@/modules/accounts/pages/AccountsPage').then((m) => ({
    default: m.AccountsPage,
  })),
)
const TransactionsPage = lazy(() =>
  import('@/modules/transactions/pages/TransactionsPage').then((m) => ({
    default: m.TransactionsPage,
  })),
)
const CreditCardsPage = lazy(() =>
  import('@/modules/cards/pages/CreditCardsPage').then((m) => ({
    default: m.CreditCardsPage,
  })),
)
const InvestmentsPage = lazy(() =>
  import('@/modules/investments/pages/InvestmentsPage').then((m) => ({
    default: m.InvestmentsPage,
  })),
)
const GoalsPage = lazy(() =>
  import('@/modules/goals/pages/GoalsPage').then((m) => ({
    default: m.GoalsPage,
  })),
)
const SettingsPage = lazy(() =>
  import('@/modules/settings/pages/SettingsPage').then((m) => ({
    default: m.SettingsPage,
  })),
)
const ImportPage = lazy(() =>
  import('@/modules/import/pages/ImportPage').then((m) => ({
    default: m.ImportPage,
  })),
)
const CategoriesPage = lazy(() =>
  import('@/modules/categories/pages/CategoriesPage').then((m) => ({
    default: m.CategoriesPage,
  })),
)
const ReportsPage = lazy(() =>
  import('@/modules/reports/pages/ReportsPage').then((m) => ({
    default: m.ReportsPage,
  })),
)

const LoadingPage = () => (
  <div className="flex items-center justify-center h-full">
    <Loader2 className="animate-spin text-primary" size={32} />
  </div>
)

const LazyComponent = ({
  Component,
}: {
  Component: React.ComponentType<any>
}) => (
  <Suspense fallback={<LoadingPage />}>
    <Component />
  </Suspense>
)

// Root component with auth check
const RootComponent = () => {
  const { isOnboarded, setOnboarded, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    const init = async () => {
      if (isOnboarded !== null) return

      try {
        const onboarded = await authService.checkOnboarding()
        setOnboarded(onboarded)
      } catch (err) {
        console.error('Failed to check onboarding', err)
      }
    }
    init()
  }, [isOnboarded, setOnboarded])

  useEffect(() => {
    if (isOnboarded === false) {
      navigate({ to: '/onboarding' })
    } else if (isOnboarded === true && !isAuthenticated) {
      navigate({ to: '/login' })
    }
  }, [isAuthenticated, isOnboarded, navigate])

  return (
    <>
      <Outlet />
    </>
  )
}

// Root route
const rootRoute = createRootRoute({
  component: RootComponent,
})

// Layout route
const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  component: MainLayout,
})

// Index route (Dashboard)
const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  component: () => <LazyComponent Component={DashboardPage} />,
})

// Accounts route
const accountsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/accounts',
  component: () => <LazyComponent Component={AccountsPage} />,
})

// Transactions route
const transactionsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/transactions',
  component: () => <LazyComponent Component={TransactionsPage} />,
})

// Cards route
const cardsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/cards',
  component: () => <LazyComponent Component={CreditCardsPage} />,
})

// Investments route
const investmentsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/investments',
  component: () => <LazyComponent Component={InvestmentsPage} />,
})

// Goals route
const goalsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/goals',
  component: () => <LazyComponent Component={GoalsPage} />,
})

// Settings route
const settingsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/settings',
  component: () => <LazyComponent Component={SettingsPage} />,
})

// Categories route
const categoriesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/categories',
  component: () => <LazyComponent Component={CategoriesPage} />,
})

// Reports route
const reportsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/reports',
  component: () => <LazyComponent Component={ReportsPage} />,
})

// Import route
const importRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/import',
  component: () => <LazyComponent Component={ImportPage} />,
})

// Login page component
const LoginPage = () => {
  const { setAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!password) {
      setError('A senha é obrigatória.')
      return
    }

    try {
      setLoading(true)
      setError('')
      await authService.login(password)
      setAuthenticated(true)
      navigate({ to: '/' })
    } catch (err: any) {
      setError(err || 'Falha ao fazer login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="bg-card p-8 rounded-lg border shadow-sm max-w-md w-full">
        <h1 className="text-2xl font-bold mb-1 tracking-tight">Bem-vindo</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Digite sua senha mestre para desbloquear.
        </p>
        <input
          type="password"
          placeholder="Senha Mestre"
          className="w-full p-2.5 border rounded-md mb-2 bg-background text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        />
        {error && <p className="text-xs text-red-500 mb-4">{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full mt-4 py-2.5 bg-primary text-primary-foreground rounded-md font-semibold text-sm transition-colors hover:bg-primary/90"
        >
          {loading ? 'Desbloqueando...' : 'Desbloquear'}
        </button>
      </div>
    </div>
  )
}

// Login route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

// Onboarding page component
const OnboardingPage = () => {
  const { setAuthenticated, setOnboarded } = useAuthStore()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSetup = async () => {
    if (!password || password.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres.')
      return
    }

    try {
      setLoading(true)
      setError('')
      await authService.setupPassword(password)
      setOnboarded(true)
      setAuthenticated(true)
      navigate({ to: '/' })
    } catch (err: any) {
      setError(err || 'Falha ao configurar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-background text-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-2xl mx-auto">
          P
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Configure sua conta
          </h1>
          <p className="text-sm text-muted-foreground">
            O ProsperApp é um app local-first. Seus dados nunca saem do seu
            computador e são protegidos por criptografia AES-256.
          </p>
        </div>
        <div className="space-y-3">
          <input
            type="password"
            placeholder="Escolha uma Senha Mestre"
            className="w-full p-2.5 border rounded-md bg-background text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSetup()}
          />
          {error && <p className="text-xs text-red-500 text-left">{error}</p>}
          <p className="text-xs text-muted-foreground text-left">
            Dica: Esta senha será usada para criptografar seu banco de dados
            localmente. Não a perca, pois não há recuperação.
          </p>
          <button
            onClick={handleSetup}
            disabled={loading}
            className="w-full mt-4 py-2.5 bg-primary text-primary-foreground rounded-md font-semibold text-sm transition-colors hover:bg-primary/90"
          >
            {loading ? 'Configurando...' : 'Começar a usar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Onboarding route
const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding',
  component: OnboardingPage,
})
const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([
    indexRoute,
    accountsRoute,
    transactionsRoute,
    cardsRoute,
    investmentsRoute,
    goalsRoute,
    categoriesRoute,
    reportsRoute,
    importRoute,
    settingsRoute,
  ]),
  loginRoute,
  onboardingRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
