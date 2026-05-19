import { Link, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { recurringService } from '@/services/recurring'
import { useAutoLock } from '@/hooks/useAutoLock'
import { CommandPalette } from '@/components/CommandPalette'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  TrendingUp,
  Target,
  Settings,
  Wallet,
  FileUp,
  Tags,
  Search,
  BarChart,
  Menu,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SidebarItemProps {
  icon: any
  label: string
  to: string
  collapsed?: boolean
  onClick?: () => void
}

const SidebarItem = ({
  icon: Icon,
  label,
  to,
  collapsed,
  onClick,
}: SidebarItemProps) => (
  <Link
    to={to}
    onClick={onClick}
    activeProps={{ className: 'bg-primary text-primary-foreground' }}
    className={cn(
      'flex items-center px-3 py-2 rounded-md text-muted-foreground hover:text-primary hover:bg-secondary transition-all duration-200',
      collapsed ? 'justify-center' : 'gap-3',
    )}
    title={collapsed ? label : undefined}
  >
    <Icon size={18} className="shrink-0" />
    {!collapsed && (
      <span className="font-medium text-sm truncate">{label}</span>
    )}
  </Link>
)

export const MainLayout = () => {
  useAutoLock()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    recurringService.processRecurringTransactions().catch(console.error)
  }, [])

  // Keyboard shortcuts globais
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        navigate({ to: '/transactions' })
      } else if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        navigate({ to: '/settings' })
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      <CommandPalette />

      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <img src="/app-icon.svg" alt="ProsperApp Logo" className="w-8 h-8 rounded-md" />
          <span className="font-bold tracking-tight text-foreground">
            ProsperApp
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'bg-card flex flex-col border-r border-border transition-all duration-300 z-40',
          'fixed md:static inset-y-0 left-0 pt-14 md:pt-0', // Mobile positioning
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <div
          className={cn(
            'flex items-center py-4 px-4 gap-3',
            collapsed ? 'justify-center' : 'justify-between',
          )}
        >
          <div className="flex items-center gap-3">
            <img 
              src="/app-icon.svg" 
              alt="ProsperApp Logo" 
              className={cn("rounded-md shrink-0", collapsed ? "w-8 h-8" : "w-9 h-9")} 
            />
            {!collapsed && (
              <span className="text-xl font-bold tracking-tight text-foreground truncate">
                ProsperApp
              </span>
            )}
          </div>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex shrink-0"
              onClick={() => setCollapsed(true)}
            >
              <Menu size={16} className="text-muted-foreground" />
            </Button>
          )}
        </div>

        <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto overflow-x-hidden">
          {collapsed && (
            <div className="flex justify-center mb-4 hidden md:flex">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(false)}
              >
                <Menu size={16} className="text-muted-foreground" />
              </Button>
            </div>
          )}

          <button
            onClick={() => {
              document.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'k', metaKey: true }),
              )
              setMobileOpen(false)
            }}
            className={cn(
              'flex items-center px-3 py-2 rounded-md text-muted-foreground hover:text-primary hover:bg-secondary transition-all duration-200 w-full mb-2',
              collapsed ? 'justify-center' : 'justify-between',
            )}
            title={collapsed ? 'Busca Global' : undefined}
          >
            <div className="flex items-center gap-3">
              <Search size={18} className="shrink-0" />
              {!collapsed && (
                <span className="font-medium text-sm truncate">
                  Busca Global
                </span>
              )}
            </div>
            {!collapsed && (
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            )}
          </button>

          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            to="/"
            collapsed={collapsed}
            onClick={() => setMobileOpen(false)}
          />
          <SidebarItem
            icon={ArrowLeftRight}
            label="Transações"
            to="/transactions"
            collapsed={collapsed}
            onClick={() => setMobileOpen(false)}
          />
          <SidebarItem
            icon={Wallet}
            label="Contas"
            to="/accounts"
            collapsed={collapsed}
            onClick={() => setMobileOpen(false)}
          />
          <SidebarItem
            icon={CreditCard}
            label="Cartões"
            to="/cards"
            collapsed={collapsed}
            onClick={() => setMobileOpen(false)}
          />
          <SidebarItem
            icon={TrendingUp}
            label="Investimentos"
            to="/investments"
            collapsed={collapsed}
            onClick={() => setMobileOpen(false)}
          />
          <SidebarItem
            icon={Target}
            label="Metas"
            to="/goals"
            collapsed={collapsed}
            onClick={() => setMobileOpen(false)}
          />
          <SidebarItem
            icon={BarChart}
            label="Relatórios"
            to="/reports"
            collapsed={collapsed}
            onClick={() => setMobileOpen(false)}
          />
          <SidebarItem
            icon={Tags}
            label="Categorias"
            to="/categories"
            collapsed={collapsed}
            onClick={() => setMobileOpen(false)}
          />
          <SidebarItem
            icon={FileUp}
            label="Importação"
            to="/import"
            collapsed={collapsed}
            onClick={() => setMobileOpen(false)}
          />
        </nav>

        <div className="p-3 border-t border-border">
          <SidebarItem
            icon={Settings}
            label="Configurações"
            to="/settings"
            collapsed={collapsed}
            onClick={() => setMobileOpen(false)}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-8 bg-background relative">
        <Outlet />
      </main>
    </div>
  )
}
